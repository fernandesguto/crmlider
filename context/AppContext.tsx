
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Agency, Property, Lead, Task, ViewState, LeadStatus, PropertyType, Message, OperationResult, FinancialRecord, LeadInterest, AiMatchOpportunity, AiStaleLeadOpportunity } from '../types.ts';
import * as DB from '../services/db.ts';

const uuid = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

interface AppContextType {
    currentUser: User | null;
    currentAgency: Agency | null;
    properties: Property[];
    leads: Lead[];
    tasks: Task[];
    users: User[];
    messages: Message[];
    financialRecords: FinancialRecord[];
    currentView: ViewState;
    setCurrentView: (view: ViewState) => void;
    isLoading: boolean;
    themeColor: string;
    setThemeColor: (color: string) => void;
    darkMode: boolean;
    setDarkMode: (mode: boolean) => void;
    
    // Auth
    login: (email: string, password: string) => Promise<OperationResult>;
    logout: () => void;
    registerAgency: (agencyName: string, adminName: string, email: string, phone: string, password: string) => Promise<OperationResult>;
    setAgency: (agency: Agency) => void; 
    
    // CRUD
    addProperty: (property: Property) => Promise<void>;
    updateProperty: (property: Property) => Promise<void>;
    deleteProperty: (id: string) => Promise<void>;
    markPropertyAsSold: (id: string, leadId?: string | null, salePrice?: number, commission?: number, soldByUserId?: string, rentalStartDate?: string, rentalEndDate?: string) => Promise<void>;
    reactivateProperty: (id: string) => Promise<void>;
    renewRental: (id: string, newRent: number, newComm: number, startDate: string, endDate: string) => Promise<void>;
    getNextPropertyCode: () => number;
    
    addLead: (lead: Lead) => Promise<void>;
    updateLead: (lead: Lead) => Promise<void>;
    updateLeadStatus: (id: string, status: LeadStatus) => Promise<void>;
    updateLeadInterestStatus: (leadId: string, propertyId: string, status: LeadStatus) => Promise<void>;
    deleteLead: (id: string) => Promise<void>;
    
    addTask: (task: Task) => Promise<void>;
    updateTask: (task: Task) => Promise<void>;
    toggleTaskCompletion: (id: string) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    
    createAgencyUser: (userData: Partial<User>) => Promise<OperationResult>;
    updateUser: (user: User) => Promise<OperationResult>;
    deleteUser: (id: string) => Promise<OperationResult>;
    
    updateAgency: (agency: Agency) => Promise<void>;
    
    // Messages
    loadMessages: (leadId: string) => Promise<void>;
    addMessage: (msg: any) => Promise<void>;
    
    // Notifications
    notificationTask: Task | null;
    notificationLead: Lead | null;
    dismissNotification: () => void;

    // AI
    aiOpportunities: AiMatchOpportunity[];
    setAiOpportunities: (opps: AiMatchOpportunity[]) => void;
    aiStaleLeads: AiStaleLeadOpportunity[];
    setAiStaleLeads: (opps: AiStaleLeadOpportunity[]) => void;

    isSuperAdmin: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Global State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentAgency, setCurrentAgency] = useState<Agency | null>(null);
    const [currentView, setCurrentView] = useState<ViewState>('LANDING');
    const [isLoading, setIsLoading] = useState(true);
    
    // Data State
    const [properties, setProperties] = useState<Property[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);

    // AI State
    const [aiOpportunities, setAiOpportunitiesState] = useState<AiMatchOpportunity[]>([]);
    const [aiStaleLeads, setAiStaleLeadsState] = useState<AiStaleLeadOpportunity[]>([]);

    // Theme
    const [themeColor, setThemeColor] = useState('#3b82f6');
    const [darkMode, setDarkMode] = useState(false);

    // Notifications
    const [notificationTask, setNotificationTask] = useState<Task | null>(null);
    const [notificationLead, setNotificationLead] = useState<Lead | null>(null);

    // AI Persistence Helper
    const setAiOpportunities = (opps: AiMatchOpportunity[]) => {
        setAiOpportunitiesState(opps);
        localStorage.setItem('imob_ai_opportunities', JSON.stringify(opps));
    };

    const setAiStaleLeads = (opps: AiStaleLeadOpportunity[]) => {
        setAiStaleLeadsState(opps);
        localStorage.setItem('imob_ai_stale_leads', JSON.stringify(opps));
    }

    // Helper to clean object before sending to DB (removes temporary props like _daysInactive)
    const sanitizeLead = (lead: Lead) => {
        const { ...cleanLead } = lead;
        // Remove properties starting with _
        Object.keys(cleanLead).forEach(key => {
            if (key.startsWith('_')) {
                delete (cleanLead as any)[key];
            }
        });
        return cleanLead;
    };

    // Auth Initialization & Load Data
    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true);
            
            const savedColor = localStorage.getItem('imob_theme_color');
            const savedDark = localStorage.getItem('imob_dark_mode');
            if (savedColor) setThemeColor(savedColor);
            if (savedDark) setDarkMode(savedDark === 'true');

            // Load saved AI opportunities
            const savedAiOpps = localStorage.getItem('imob_ai_opportunities');
            if (savedAiOpps) {
                try {
                    setAiOpportunitiesState(JSON.parse(savedAiOpps));
                } catch (e) {
                    console.error("Failed to parse saved AI opportunities", e);
                }
            }

            // Load saved AI Stale Leads
            const savedAiStale = localStorage.getItem('imob_ai_stale_leads');
            if (savedAiStale) {
                try {
                    setAiStaleLeadsState(JSON.parse(savedAiStale));
                } catch (e) {
                    console.error("Failed to parse saved AI stale leads", e);
                }
            }

            const savedUserId = localStorage.getItem('imob_user_id');
            if (savedUserId) {
                try {
                    const users = await DB.getAll<User>('users', { column: 'id', value: savedUserId });
                    if (users && users.length > 0) {
                        const user = users[0];
                        setCurrentUser(user);
                        
                        const agencies = await DB.getAll<Agency>('agencies', { column: 'id', value: user.agencyId });
                        if (agencies && agencies.length > 0) {
                            setCurrentAgency(agencies[0]);
                            // Mantém Landing Page
                        }
                    } else {
                        localStorage.removeItem('imob_user_id');
                    }
                } catch (error) {
                    console.error("Auth init error", error);
                }
            }
            setIsLoading(false);
        };
        
        DB.seedDatabase().then(() => initAuth());
    }, []);

    useEffect(() => {
        localStorage.setItem('imob_theme_color', themeColor);
        localStorage.setItem('imob_dark_mode', String(darkMode));
    }, [themeColor, darkMode]);

    useEffect(() => {
        if (!currentUser || !currentAgency) return;

        const loadData = async () => {
            const agencyId = currentAgency.id;
            
            const props = await DB.getAll<Property>('properties', { column: 'agencyId', value: agencyId });
            setProperties(props || []);

            const lds = await DB.getAll<Lead>('leads', { column: 'agencyId', value: agencyId });
            setLeads(lds || []);

            const tsks = await DB.getAll<Task>('tasks', { column: 'agencyId', value: agencyId });
            setTasks(tsks || []);

            const usrs = await DB.getAll<User>('users', { column: 'agencyId', value: agencyId });
            setUsers(usrs || []);

            try {
                const recs = await DB.getAll<FinancialRecord>('financial_records', { column: 'agencyId', value: agencyId });
                setFinancialRecords(recs || []);
            } catch (e) {
                // Tabela pode não existir ainda se o usuário não rodou migration, ignorar silenciosamente
                console.log('Financial records table might not exist yet.');
            }
        };

        loadData();
    }, [currentUser, currentAgency]);

    // Monitoramento de Novos Leads
    useEffect(() => {
        if (!currentUser || !currentAgency) return;

        const interval = setInterval(async () => {
            const now = new Date();
            const thirtySecondsAgo = new Date(now.getTime() - 30000);
            
            try {
                const latestLeads = await DB.getAll<Lead>('leads', { column: 'agencyId', value: currentAgency.id });
                
                if (latestLeads.length > leads.length) {
                    const newLead = latestLeads.find(l => new Date(l.createdAt) > thirtySecondsAgo);
                    if (newLead) {
                        setNotificationLead(newLead);
                        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                        audio.play().catch(e => console.log('Audio play failed', e));
                    }
                    setLeads(latestLeads);
                }
            } catch (e) {
                // silent fail
            }
        }, 30000); 

        return () => clearInterval(interval);
    }, [currentUser, currentAgency, leads]);

    // Monitoramento de Tarefas Agendadas (Alarme)
    useEffect(() => {
        if (!currentUser) return;

        const interval = setInterval(() => {
            const now = new Date();
            
            // Procura tarefas não concluídas cuja data/hora seja agora (janela de 30s para evitar repetição excessiva ou perda)
            const dueTask = tasks.find(t => {
                if (t.completed) return false;
                const dueDate = new Date(t.dueDate);
                // Verifica se a data é válida
                if (isNaN(dueDate.getTime())) return false;

                const diff = now.getTime() - dueDate.getTime();
                
                // Se a tarefa venceu nos últimos 20 segundos (janela de disparo)
                // Isso garante que só dispara quando "chega a hora"
                return diff >= 0 && diff < 20000; 
            });

            // Se encontrou tarefa e ela ainda não é a notificação atual
            if (dueTask && notificationTask?.id !== dueTask.id) {
                setNotificationTask(dueTask);
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(e => console.log('Audio error', e));
            }
        }, 10000); // Verifica a cada 10 segundos

        return () => clearInterval(interval);
    }, [currentUser, tasks, notificationTask]);

    const login = async (email: string, password: string): Promise<OperationResult> => {
        try {
            const users = await DB.getAll<User>('users', { column: 'email', value: email });
            const user = users.find(u => u.password === password || u.password === undefined); 
            
            if (user) {
                const agencies = await DB.getAll<Agency>('agencies', { column: 'id', value: user.agencyId });
                
                if (!agencies || agencies.length === 0) {
                    return { success: false, message: 'Agência não encontrada.' };
                }

                const agency = agencies[0];

                if (!agency.isApproved) {
                    if (agency.trialExpiresAt) {
                        const today = new Date();
                        const expiration = new Date(agency.trialExpiresAt);
                        
                        if (today > expiration) {
                            return { success: false, message: 'Período de teste expirado. Entre em contato para liberar o acesso.' };
                        }
                    } else {
                        return { success: false, message: 'Seu cadastro está em análise. Aguarde a aprovação do administrador.' };
                    }
                }

                localStorage.setItem('imob_user_id', user.id);
                setCurrentUser(user);
                setCurrentAgency(agency);
                setCurrentView('DASHBOARD');
                
                await DB.updateItem('users', { ...user, loginCount: (user.loginCount || 0) + 1 });
                
                return { success: true };
            }
            return { success: false, message: 'Email ou senha inválidos.' };
        } catch (e) {
            return { success: false, message: 'Erro de conexão.' };
        }
    };

    const logout = () => {
        localStorage.removeItem('imob_user_id');
        // Não remover 'imob_ai_opportunities' nem 'imob_ai_stale_leads' para persistir os dados da IA
        setCurrentUser(null);
        setCurrentAgency(null);
        setCurrentView('LANDING'); 
        setProperties([]);
        setLeads([]);
        setTasks([]);
        setUsers([]);
        setAiOpportunitiesState([]);
        setAiStaleLeadsState([]);
        window.location.reload(); 
    };

    const registerAgency = async (agencyName: string, adminName: string, email: string, phone: string, password: string): Promise<OperationResult> => {
        try {
            const existingUsers = await DB.getAll<User>('users', { column: 'email', value: email });
            if (existingUsers.length > 0) {
                return { success: false, message: 'Este e-mail já está em uso.' };
            }

            const agencyId = uuid();
            const userId = uuid();

            const trialDate = new Date();
            trialDate.setDate(trialDate.getDate() + 3);

            const newAgency: Agency = {
                id: agencyId,
                name: agencyName,
                createdAt: new Date().toISOString(),
                isApproved: false, 
                trialExpiresAt: trialDate.toISOString(),
                phone: phone
            };
            
            const newAdmin: User = {
                id: userId,
                name: adminName,
                email,
                password,
                phone,
                role: 'Admin',
                agencyId,
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=random`,
                loginCount: 0
            };

            await DB.addItem('agencies', newAgency);
            await DB.addItem('users', newAdmin);

            return { success: true, message: 'Conta criada! Você tem 3 dias de teste grátis liberados. Faça login para começar.' };
        } catch (e: any) {
             if (e.code === '23505') return { success: false, message: 'Este e-mail já está cadastrado.' };
             return { success: false, message: e.message || 'Erro ao criar conta.' };
        }
    };

    const addProperty = async (property: Property) => {
        const nextCode = getNextPropertyCode();
        const propertyWithCode = { ...property, code: nextCode };
        
        const saved = await DB.addItem<Property>('properties', propertyWithCode);
        setProperties(prev => [...prev, saved]);
    };

    const updateProperty = async (property: Property) => {
        await DB.updateItem('properties', property);
        setProperties(prev => prev.map(p => p.id === property.id ? property : p));
    };

    const deleteProperty = async (id: string) => {
        try {
            const propertyToDelete = properties.find(p => p.id === id);
            await DB.deleteItem('properties', id);
            setProperties(prev => prev.filter(p => p.id !== id));
            if (propertyToDelete && propertyToDelete.images && propertyToDelete.images.length > 0) {
                DB.deleteStorageImages(propertyToDelete.images);
            }
        } catch (error: any) {
            alert(error.message);
        }
    };

    const markPropertyAsSold = async (id: string, leadId?: string | null, salePrice?: number, commission?: number, soldByUserId?: string, rentalStartDate?: string, rentalEndDate?: string) => {
        // Encontra o imóvel atual para acessar as imagens
        const currentProp = properties.find(p => p.id === id);
        let finalImages = currentProp?.images || [];

        // Lógica de Otimização de Armazenamento:
        // Se houver mais de 1 foto, deleta todas exceto a capa (índice 0)
        if (currentProp && currentProp.images && currentProp.images.length > 1) {
            const imagesToDelete = currentProp.images.slice(1); // Pega do índice 1 em diante
            finalImages = [currentProp.images[0]]; // Mantém apenas a capa

            // Deleta do Storage
            await DB.deleteStorageImages(imagesToDelete);
        }

        const update: Partial<Property> = {
            id,
            status: 'Sold',
            soldAt: rentalStartDate || new Date().toISOString(), // Se for aluguel, usa a data escolhida
            rentalEndDate: rentalEndDate, // Data final se for locação
            soldToLeadId: leadId,
            soldByUserId,
            salePrice,
            commissionValue: commission,
            images: finalImages // Salva o array atualizado (apenas capa)
        };
        
        // @ts-ignore - Partial update
        await DB.updateItem('properties', update);
        setProperties(prev => prev.map(p => p.id === id ? { ...p, ...update } as Property : p));
        
        if (leadId) {
            // Ao vender, se o lead existir, podemos fechar a negociação deste imóvel
            updateLeadInterestStatus(leadId, id, LeadStatus.CLOSED);
        }

        // --- AUTOMAÇÃO DE ALERTA DE VENCIMENTO ---
        // Se for locação e tiver data de término, cria uma tarefa para avisar 7 dias antes
        if (rentalEndDate && currentAgency) {
            try {
                const endDate = new Date(rentalEndDate);
                const notificationDate = new Date(endDate);
                notificationDate.setDate(notificationDate.getDate() - 7);
                notificationDate.setHours(9, 0, 0, 0); // Define alerta para 09:00

                // Nome do Inquilino
                const tenantName = leadId ? leads.find(l => l.id === leadId)?.name || 'Inquilino' : 'Inquilino Externo';

                const reminderTask: Task = {
                    id: uuid(),
                    title: `Vencimento Contrato: ${currentProp?.title || 'Imóvel'}`,
                    description: `O contrato de locação do inquilino ${tenantName} vence em 7 dias (${endDate.toLocaleDateString()}). Entrar em contato para renovação ou devolução.`,
                    dueDate: notificationDate.toISOString(),
                    completed: false,
                    assignedTo: soldByUserId || currentUser?.id || '', // Atribui ao corretor da locação ou quem fechou
                    agencyId: currentAgency.id,
                    propertyId: id,
                    leadId: leadId || undefined
                };

                await addTask(reminderTask);
                console.log("Tarefa de vencimento criada para:", notificationDate);
            } catch (e) {
                console.error("Erro ao criar tarefa de vencimento automática:", e);
            }
        }
    };

    const reactivateProperty = async (id: string) => {
        // Ao reativar:
        // 1. Se for LOCAÇÃO: Entendemos como "Fim de Contrato". Salvamos o histórico do período locado e liberamos o imóvel.
        // 2. Se for VENDA: Entendemos como "Cancelamento da Venda". NÃO salvamos histórico, para que o valor saia dos gráficos (estorno).
        const prop = properties.find(p => p.id === id);
        
        if (prop && prop.status === 'Sold' && currentAgency) {
            // Apenas salva histórico se for Locação
            if (prop.type.includes('Locação')) {
                try {
                    const historyRecord: FinancialRecord = {
                        id: uuid(),
                        agencyId: currentAgency.id,
                        propertyId: prop.id,
                        type: 'Rental',
                        value: prop.salePrice || 0,
                        commission: prop.commissionValue || 0,
                        date: prop.soldAt || new Date().toISOString(),
                        endDate: new Date().toISOString(), // Data do encerramento (hoje)
                        leadId: prop.soldToLeadId,
                        brokerId: prop.soldByUserId
                    };
                    
                    await DB.addItem('financial_records', historyRecord);
                    setFinancialRecords(prev => [...prev, historyRecord]);
                } catch (e) {
                    console.error("Erro ao salvar histórico financeiro:", e);
                }
            }
        }

        const update = {
            id,
            status: 'Active',
            soldAt: null,
            rentalEndDate: null,
            soldToLeadId: null,
            soldByUserId: null,
            salePrice: null,
            commissionValue: null,
            commissionDistribution: null // Limpa o rateio ao reativar
        };
        // @ts-ignore
        await DB.updateItem('properties', update);
        setProperties(prev => prev.map(p => p.id === id ? { 
            ...p, 
            status: 'Active', 
            soldAt: undefined, 
            rentalEndDate: undefined, 
            soldToLeadId: undefined, 
            soldByUserId: undefined, 
            salePrice: undefined, 
            commissionValue: undefined,
            commissionDistribution: undefined
        } : p));
    };

    const renewRental = async (id: string, newRent: number, newComm: number, startDate: string, endDate: string) => {
        const prop = properties.find(p => p.id === id);
        if (!prop || !currentAgency) return;

        // 1. Criar registro histórico do período ANTERIOR (Contrato Antigo)
        const historyRecord: FinancialRecord = {
            id: uuid(),
            agencyId: currentAgency.id,
            propertyId: prop.id,
            type: 'Rental',
            value: prop.salePrice || 0, // Valor Antigo
            commission: prop.commissionValue || 0, // Comissão Antiga
            date: prop.soldAt || new Date().toISOString(), // Data Início original
            endDate: prop.rentalEndDate || new Date().toISOString(), // Data fim original
            leadId: prop.soldToLeadId,
            brokerId: prop.soldByUserId
        };

        // Salva no banco (Tabela financial_records)
        await DB.addItem('financial_records', historyRecord);
        setFinancialRecords(prev => [...prev, historyRecord]);

        // 2. Atualizar o Imóvel para o NOVO período (Renovação)
        const note = `\n[Renovação]: Contrato de ${new Date(startDate).toLocaleDateString()} até ${new Date(endDate).toLocaleDateString()}. Valor: R$${newRent}, Comissão: R$${newComm}.`;
        const currentNotes = prop.internalNotes || '';

        const update = { 
            id, 
            salePrice: newRent, 
            commissionValue: newComm,
            soldAt: new Date(startDate).toISOString(), // NOVO INÍCIO
            rentalEndDate: new Date(endDate).toISOString(), // NOVO FIM
            internalNotes: currentNotes + note
        };
        
        // Atualiza no banco (Tabela properties)
        // @ts-ignore
        await DB.updateItem('properties', update);
        
        // Atualiza estado local
        setProperties(prev => prev.map(p => p.id === id ? { 
            ...p, 
            salePrice: newRent, 
            commissionValue: newComm, 
            soldAt: update.soldAt,
            rentalEndDate: update.rentalEndDate,
            internalNotes: (p.internalNotes || '') + note 
        } : p));
    };

    const getNextPropertyCode = () => {
        if (properties.length === 0) return 1;
        const max = Math.max(...properties.map(p => p.code || 0));
        return max + 1;
    };

    const addLead = async (lead: Lead) => {
        try {
            // Garantir que interests esteja preenchido com base em interestedInPropertyIds
            const interests: LeadInterest[] = lead.interests || [];
            if (interests.length === 0 && lead.interestedInPropertyIds.length > 0) {
                lead.interestedInPropertyIds.forEach(propId => {
                    interests.push({
                        propertyId: propId,
                        status: LeadStatus.NEW,
                        updatedAt: new Date().toISOString()
                    });
                });
            }
            
            const leadToSave = sanitizeLead({ ...lead, interests });
            
            const saved = await DB.addItem<Lead>('leads', leadToSave);
            setLeads(prev => [saved, ...prev]); 
            setNotificationLead(saved); 
        } catch (e) {
            console.error("Failed to add lead", e);
            // Ignora o erro se for apenas o interests (schema antigo), mas tenta salvar sem
            if ((e as any).code === '42703') {
                 // Retry without interests
                 const { interests, ...oldSchemaLead } = lead;
                 await DB.addItem('leads', oldSchemaLead);
                 // We don't update local state with interests to reflect db state, 
                 // but we can warn user via DB.addItem alert handled in db.ts
            }
        }
    };

    const updateLead = async (lead: Lead) => {
        try {
            const safeLead = sanitizeLead(lead);
            await DB.updateItem('leads', safeLead);
            setLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
        } catch (e) {
            console.error("Update lead failed", e);
        }
    };

    const updateLeadStatus = async (id: string, status: LeadStatus) => {
        try {
            await DB.updateItem('leads', { id, status });
            setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
        } catch (e) {
            console.error("Status update failed", e);
        }
    };

    const updateLeadInterestStatus = async (leadId: string, propertyId: string, status: LeadStatus) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;

        let newInterests = lead.interests ? [...lead.interests] : [];
        
        // Se interests está vazio mas temos interestedInPropertyIds (legado)
        if (newInterests.length === 0 && lead.interestedInPropertyIds.length > 0) {
             lead.interestedInPropertyIds.forEach(pid => {
                 newInterests.push({
                     propertyId: pid,
                     status: pid === propertyId ? status : (lead.status || LeadStatus.NEW),
                     updatedAt: new Date().toISOString()
                 });
             });
        } else {
            const index = newInterests.findIndex(i => i.propertyId === propertyId);
            if (index >= 0) {
                newInterests[index] = { ...newInterests[index], status, updatedAt: new Date().toISOString() };
            } else {
                // Adiciona se não existir
                newInterests.push({ propertyId, status, updatedAt: new Date().toISOString() });
            }
        }

        // Garante sincronia do array de strings
        const newPropertyIds = Array.from(new Set([...lead.interestedInPropertyIds, propertyId]));

        try {
            await DB.updateItem('leads', { id: leadId, interests: newInterests, interestedInPropertyIds: newPropertyIds });
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, interests: newInterests, interestedInPropertyIds: newPropertyIds } : l));
        } catch (e) {
            console.error("Update interests failed", e);
            // Fallback for old schema: update just the global status if it matches the lead's main interest
            // or just suppress if DB alert already showed.
        }
    };

    const deleteLead = async (id: string) => {
        try {
            await DB.deleteItem('leads', id);
            setLeads(prev => prev.filter(l => l.id !== id));
        } catch (error: any) {
            alert(error.message);
        }
    };

    const addTask = async (task: Task) => {
        const saved = await DB.addItem<Task>('tasks', task);
        setTasks(prev => [...prev, saved]);
        // REMOVIDO: setNotificationTask(saved); -> Não mostra popup ao criar
    };

    const updateTask = async (task: Task) => {
        await DB.updateItem('tasks', task);
        setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    };

    const toggleTaskCompletion = async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            const newStatus = !task.completed;
            await DB.updateItem('tasks', { id, completed: newStatus });
            setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newStatus } : t));
        }
    };

    const deleteTask = async (id: string) => {
        try {
            await DB.deleteItem('tasks', id);
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (error: any) {
            alert(error.message);
        }
    };

    const createAgencyUser = async (userData: Partial<User>): Promise<OperationResult> => {
        if (!currentAgency) return { success: false, message: 'Sem agência.' };
        try {
            const existingUsers = await DB.getAll<User>('users', { column: 'email', value: userData.email! });
            if (existingUsers && existingUsers.length > 0) {
                return { success: false, message: 'Este e-mail já está em uso.' };
            }

            const newUser: User = {
                id: uuid(),
                name: userData.name!,
                email: userData.email!,
                password: userData.password!,
                phone: userData.phone,
                role: userData.role || 'Broker',
                avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || '')}&background=random`,
                agencyId: currentAgency.id,
                loginCount: 0
            };
            const savedUser = await DB.addItem<User>('users', newUser);
            setUsers(prev => [...prev, savedUser]);
            return { success: true };
        } catch (error: any) {
            if (error.code === '23505') return { success: false, message: 'Este e-mail já está em uso por outro usuário.' };
            return { success: false, message: typeof error.message === 'string' ? error.message : 'Erro ao criar usuário.' };
        }
    };

    const updateUser = async (user: User): Promise<OperationResult> => {
        try {
            await DB.updateItem('users', user);
            setUsers(prev => prev.map(u => u.id === user.id ? user : u));
            if (currentUser?.id === user.id) setCurrentUser(user);
            return { success: true };
        } catch (e: any) {
            if (e.code === '23505') return { success: false, message: 'Este e-mail já está em uso por outro usuário.' };
            return { success: false, message: e.message };
        }
    };

    const deleteUser = async (id: string): Promise<OperationResult> => {
        try {
            await DB.deleteItem('users', id);
            setUsers(prev => prev.filter(u => u.id !== id));
            return { success: true };
        } catch (e: any) {
            return { success: false, message: e.message };
        }
    };

    const updateAgency = async (agency: Agency) => {
        await DB.updateItem('agencies', agency);
        setCurrentAgency(agency);
    };

    const loadMessages = async (leadId: string) => {
        setMessages([]); 
    };

    const addMessage = async (msg: any) => {
        setMessages(prev => [...prev, msg]);
    };
    
    const dismissNotification = () => {
        setNotificationTask(null);
        setNotificationLead(null);
    };

    return (
        <AppContext.Provider value={{
            currentUser, currentAgency, properties, leads, tasks, users, messages, financialRecords,
            currentView, setCurrentView, isLoading,
            themeColor, setThemeColor, darkMode, setDarkMode,
            login, logout, registerAgency,
            setAgency: setCurrentAgency,
            addProperty, updateProperty, deleteProperty, markPropertyAsSold, reactivateProperty, renewRental, getNextPropertyCode,
            addLead, updateLead, updateLeadStatus, updateLeadInterestStatus, deleteLead,
            addTask, updateTask, toggleTaskCompletion, deleteTask,
            createAgencyUser, updateUser, deleteUser,
            updateAgency,
            loadMessages, addMessage,
            notificationTask, notificationLead, dismissNotification,
            aiOpportunities, setAiOpportunities,
            aiStaleLeads, setAiStaleLeads,
            isSuperAdmin: currentUser?.email === 'fernandes_guto@hotmail.com'
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
