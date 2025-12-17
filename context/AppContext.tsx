
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, Agency, Property, Lead, Task, ViewState, LeadStatus, PropertyType, Message, OperationResult, FinancialRecord, LeadInterest, AiMatchOpportunity, AiRecoveryOpportunity } from '../types.ts';
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
    login: (email: string, password: string) => Promise<OperationResult>;
    logout: () => void;
    registerAgency: (agencyName: string, adminName: string, email: string, phone: string, password: string) => Promise<OperationResult>;
    setAgency: (agency: Agency) => void; 
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
    loadMessages: (leadId: string) => Promise<void>;
    addMessage: (msg: any) => Promise<void>;
    notificationTask: Task | null;
    notificationLead: Lead | null;
    dismissNotification: () => void;
    aiOpportunities: AiMatchOpportunity[];
    setAiOpportunities: (opps: AiMatchOpportunity[]) => void;
    aiStaleLeads: AiRecoveryOpportunity[];
    setAiStaleLeads: (opps: AiRecoveryOpportunity[]) => void;
    isSuperAdmin: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within an AppProvider");
    return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentAgency, setCurrentAgency] = useState<Agency | null>(null);
    const [currentView, setCurrentView] = useState<ViewState>('LANDING');
    const [isLoading, setIsLoading] = useState(true);
    const [properties, setProperties] = useState<Property[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
    const [aiOpportunities, setAiOpportunitiesState] = useState<AiMatchOpportunity[]>([]);
    const [aiStaleLeads, setAiStaleLeadsState] = useState<AiRecoveryOpportunity[]>([]);
    const [themeColor, setThemeColor] = useState('#3b82f6');
    const [darkMode, setDarkMode] = useState(false);
    const [notificationTask, setNotificationTask] = useState<Task | null>(null);
    const [notificationLead, setNotificationLead] = useState<Lead | null>(null);

    const leadsRef = useRef(leads);
    useEffect(() => { leadsRef.current = leads; }, [leads]);

    const setAiOpportunities = (opps: AiMatchOpportunity[]) => {
        setAiOpportunitiesState(opps);
        localStorage.setItem('imob_ai_opportunities', JSON.stringify(opps));
    };

    const setAiStaleLeads = (opps: AiRecoveryOpportunity[]) => {
        setAiStaleLeadsState(opps);
        localStorage.setItem('imob_ai_stale_leads', JSON.stringify(opps));
    };

    const sanitizeLead = (lead: Lead) => {
        const { ...cleanLead } = lead;
        Object.keys(cleanLead).forEach(key => { if (key.startsWith('_')) delete (cleanLead as any)[key]; });
        return cleanLead;
    };

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            try {
                const savedColor = localStorage.getItem('imob_theme_color');
                const savedDark = localStorage.getItem('imob_dark_mode');
                if (savedColor) setThemeColor(savedColor);
                if (savedDark) setDarkMode(savedDark === 'true');

                const savedAiOpps = localStorage.getItem('imob_ai_opportunities');
                if (savedAiOpps) try { setAiOpportunitiesState(JSON.parse(savedAiOpps)); } catch (e) {}

                const savedAiStale = localStorage.getItem('imob_ai_stale_leads');
                if (savedAiStale) try { setAiStaleLeadsState(JSON.parse(savedAiStale)); } catch (e) {}

                await DB.seedDatabase();

                const savedUserId = localStorage.getItem('imob_user_id');
                if (savedUserId) {
                    const usrs = await DB.getAll<User>('users', { column: 'id', value: savedUserId });
                    if (usrs && usrs.length > 0) {
                        const user = usrs[0];
                        setCurrentUser(user);
                        const agencies = await DB.getAll<Agency>('agencies', { column: 'id', value: user.agencyId });
                        if (agencies && agencies.length > 0) setCurrentAgency(agencies[0]);
                    } else {
                        localStorage.removeItem('imob_user_id');
                    }
                }
            } catch (error) {
                console.error("Erro na inicialização:", error);
            } finally {
                setIsLoading(false);
            }
        };
        init();
    }, []);

    useEffect(() => {
        localStorage.setItem('imob_theme_color', themeColor);
        localStorage.setItem('imob_dark_mode', String(darkMode));
    }, [themeColor, darkMode]);

    useEffect(() => {
        if (!currentUser || !currentAgency) return;
        const loadData = async () => {
            const agencyId = currentAgency.id;
            try {
                const [props, lds, tsks, usrs, recs] = await Promise.all([
                    DB.getAll<Property>('properties', { column: 'agencyId', value: agencyId }),
                    DB.getAll<Lead>('leads', { column: 'agencyId', value: agencyId }),
                    DB.getAll<Task>('tasks', { column: 'agencyId', value: agencyId }),
                    DB.getAll<User>('users', { column: 'agencyId', value: agencyId }),
                    DB.getAll<FinancialRecord>('financial_records', { column: 'agencyId', value: agencyId }).catch(() => [])
                ]);
                setProperties(props);
                setLeads(lds);
                setTasks(tsks);
                setUsers(usrs);
                setFinancialRecords(recs);
            } catch (e) {
                console.warn("Erro ao carregar dados da agência.");
            }
        };
        loadData();
    }, [currentUser, currentAgency]);

    useEffect(() => {
        if (!currentUser || !currentAgency) return;
        const interval = setInterval(async () => {
            try {
                const latestLeads = await DB.getAll<Lead>('leads', { column: 'agencyId', value: currentAgency.id });
                if (latestLeads.length > leadsRef.current.length) {
                    const newLead = latestLeads[0];
                    setNotificationLead(newLead);
                    setLeads(latestLeads);
                }
            } catch (e) {}
        }, 60000); 
        return () => clearInterval(interval);
    }, [currentUser, currentAgency]);

    const login = async (email: string, password: string): Promise<OperationResult> => {
        try {
            const users = await DB.getAll<User>('users', { column: 'email', value: email });
            const user = users.find(u => u.password === password); 
            if (user) {
                const agencies = await DB.getAll<Agency>('agencies', { column: 'id', value: user.agencyId });
                if (!agencies || agencies.length === 0) return { success: false, message: 'Agência não encontrada.' };
                const agency = agencies[0];
                if (!agency.isApproved) {
                    if (agency.trialExpiresAt && new Date() > new Date(agency.trialExpiresAt)) {
                        return { success: false, message: 'Período de teste expirado.' };
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
            return { success: false, message: 'Falha na conexão com o servidor.' };
        }
    };

    const logout = () => {
        localStorage.removeItem('imob_user_id');
        window.location.reload(); 
    };

    const registerAgency = async (agencyName: string, adminName: string, email: string, phone: string, password: string): Promise<OperationResult> => {
        try {
            const agencyId = uuid();
            const userId = uuid();
            const trialDate = new Date();
            trialDate.setDate(trialDate.getDate() + 3);
            const newAgency: Agency = { id: agencyId, name: agencyName, createdAt: new Date().toISOString(), isApproved: false, trialExpiresAt: trialDate.toISOString(), phone: phone };
            const newAdmin: User = { id: userId, name: adminName, email, password, phone, role: 'Admin', agencyId, avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=random`, loginCount: 0 };
            await DB.addItem('agencies', newAgency);
            await DB.addItem('users', newAdmin);
            return { success: true, message: 'Conta criada! Você tem 3 dias de teste.' };
        } catch (e: any) {
             return { success: false, message: 'Erro ao criar conta. Verifique os dados.' };
        }
    };

    const addProperty = async (property: Property) => {
        const nextCode = getNextPropertyCode();
        const saved = await DB.addItem<Property>('properties', { ...property, code: nextCode });
        setProperties(prev => [...prev, saved]);
    };

    const updateProperty = async (property: Property) => {
        await DB.updateItem('properties', property);
        setProperties(prev => prev.map(p => p.id === property.id ? property : p));
    };

    const deleteProperty = async (id: string) => {
        const prop = properties.find(p => p.id === id);
        await DB.deleteItem('properties', id);
        setProperties(prev => prev.filter(p => p.id !== id));
        if (prop?.images) DB.deleteStorageImages(prop.images);
    };

    const markPropertyAsSold = async (id: string, leadId?: string | null, salePrice?: number, commission?: number, soldByUserId?: string, rentalStartDate?: string, rentalEndDate?: string) => {
        const update = { id, status: 'Sold', soldAt: rentalStartDate || new Date().toISOString(), rentalEndDate, soldToLeadId: leadId, soldByUserId, salePrice, commissionValue: commission };
        await DB.updateItem('properties', update);
        setProperties(prev => prev.map(p => p.id === id ? { ...p, ...update } as Property : p));
        if (leadId) updateLeadInterestStatus(leadId, id, LeadStatus.CLOSED);
    };

    const reactivateProperty = async (id: string) => {
        const update = { id, status: 'Active', soldAt: null, rentalEndDate: null, soldToLeadId: null, soldByUserId: null, salePrice: null, commissionValue: null, commissionDistribution: null };
        await DB.updateItem('properties', update);
        setProperties(prev => prev.map(p => p.id === id ? { ...p, ...update } as any : p));
    };

    const renewRental = async (id: string, newRent: number, newComm: number, startDate: string, endDate: string) => {
        const prop = properties.find(p => p.id === id);
        if (!prop || !currentAgency) return;
        const update = { id, salePrice: newRent, commissionValue: newComm, soldAt: new Date(startDate).toISOString(), rentalEndDate: new Date(endDate).toISOString() };
        await DB.updateItem('properties', update);
        setProperties(prev => prev.map(p => p.id === id ? { ...p, ...update } : p));
    };

    const getNextPropertyCode = () => properties.length === 0 ? 1 : Math.max(...properties.map(p => p.code || 0)) + 1;

    const addLead = async (lead: Lead) => {
        const saved = await DB.addItem<Lead>('leads', sanitizeLead(lead));
        setLeads(prev => [saved, ...prev]);
        setNotificationLead(saved);
    };

    const updateLead = async (lead: Lead) => {
        await DB.updateItem('leads', sanitizeLead(lead));
        setLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
    };

    const updateLeadStatus = async (id: string, status: LeadStatus) => {
        await DB.updateItem('leads', { id, status });
        setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    };

    const updateLeadInterestStatus = async (leadId: string, propertyId: string, status: LeadStatus) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;
        const interests = lead.interests ? [...lead.interests] : [];
        const idx = interests.findIndex(i => i.propertyId === propertyId);
        if (idx >= 0) interests[idx] = { ...interests[idx], status, updatedAt: new Date().toISOString() };
        else interests.push({ propertyId, status, updatedAt: new Date().toISOString() });
        await DB.updateItem('leads', { id: leadId, interests });
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, interests } : l));
    };

    const deleteLead = async (id: string) => {
        await DB.deleteItem('leads', id);
        setLeads(prev => prev.filter(l => l.id !== id));
    };

    const addTask = async (task: Task) => {
        const saved = await DB.addItem<Task>('tasks', task);
        setTasks(prev => [...prev, saved]);
    };

    const updateTask = async (task: Task) => {
        await DB.updateItem('tasks', task);
        setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    };

    const toggleTaskCompletion = async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            const completed = !task.completed;
            await DB.updateItem('tasks', { id, completed });
            setTasks(prev => prev.map(t => t.id === id ? { ...t, completed } : t));
        }
    };

    const deleteTask = async (id: string) => {
        await DB.deleteItem('tasks', id);
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const createAgencyUser = async (userData: Partial<User>): Promise<OperationResult> => {
        if (!currentAgency) return { success: false, message: 'Sem agência.' };
        const newUser: User = { id: uuid(), name: userData.name!, email: userData.email!, password: userData.password!, phone: userData.phone, role: userData.role || 'Broker', avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || '')}`, agencyId: currentAgency.id, loginCount: 0 };
        const saved = await DB.addItem<User>('users', newUser);
        setUsers(prev => [...prev, saved]);
        return { success: true };
    };

    const updateUser = async (user: User) => {
        await DB.updateItem('users', user);
        setUsers(prev => prev.map(u => u.id === user.id ? user : u));
        if (currentUser?.id === user.id) setCurrentUser(user);
        return { success: true };
    };

    const deleteUser = async (id: string) => {
        await DB.deleteItem('users', id);
        setUsers(prev => prev.filter(u => u.id !== id));
        return { success: true };
    };

    const updateAgency = async (agency: Agency) => {
        await DB.updateItem('agencies', agency);
        setCurrentAgency(agency);
    };

    const loadMessages = async (leadId: string) => setMessages([]);
    const addMessage = async (msg: any) => setMessages(prev => [...prev, msg]);
    const dismissNotification = () => { setNotificationTask(null); setNotificationLead(null); };

    return (
        <AppContext.Provider value={{
            currentUser, currentAgency, properties, leads, tasks, users, messages, financialRecords,
            currentView, setCurrentView, isLoading, themeColor, setThemeColor, darkMode, setDarkMode,
            login, logout, registerAgency, setAgency: setCurrentAgency,
            addProperty, updateProperty, deleteProperty, markPropertyAsSold, reactivateProperty, renewRental, getNextPropertyCode,
            addLead, updateLead, updateLeadStatus, updateLeadInterestStatus, deleteLead,
            addTask, updateTask, toggleTaskCompletion, deleteTask,
            createAgencyUser, updateUser, deleteUser, updateAgency,
            loadMessages, addMessage, notificationTask, notificationLead, dismissNotification,
            aiOpportunities, setAiOpportunities, aiStaleLeads, setAiStaleLeads,
            isSuperAdmin: currentUser?.email === 'fernandes_guto@hotmail.com'
        }}>
            {children}
        </AppContext.Provider>
    );
};
