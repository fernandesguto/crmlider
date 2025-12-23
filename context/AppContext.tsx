
// @ts-nocheck
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, Agency, Property, Lead, Task, ViewState, LeadStatus, PropertyType, Message, OperationResult, FinancialRecord, LeadInterest, AiMatchOpportunity, AiRecoveryOpportunity } from '../types';
import * as DB from '../services/db';

const uuid = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

interface AppContextType {
    currentUser: User | null;
    currentAgency: Agency | null;
    publicAgency: Agency | null; // Agência sendo visualizada publicamente
    properties: Property[];
    leads: Lead[];
    tasks: Task[];
    users: User[];
    messages: Message[];
    financialRecords: FinancialRecord[];
    currentView: ViewState;
    setCurrentView: (view: ViewState) => void;
    authTab: 'login' | 'register';
    setAuthTab: (tab: 'login' | 'register') => void;
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
    pendingAgenciesCount: number;
    refreshPendingCount: () => Promise<void>;
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
    const [publicAgency, setPublicAgency] = useState<Agency | null>(null);
    
    // Inicialização inteligente da view para evitar flicker da landing page em acessos públicos
    const [currentView, setCurrentView] = useState<ViewState>(() => {
        const params = new URLSearchParams(window.location.search);
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const publicId = params.get('agency') || params.get('imob') || pathParts[0];
        if (publicId && publicId !== 'index.html' && publicId !== 'index2.html') {
            return 'PUBLIC';
        }
        return 'LANDING';
    });

    const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
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
    const [pendingAgenciesCount, setPendingAgenciesCount] = useState(0);

    const notifiedTaskIds = useRef<Set<string>>(new Set());

    const isSuperAdmin = currentUser?.email === 'fernandes_guto@hotmail.com';

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

    const refreshPendingCount = async () => {
        if (!isSuperAdmin) return;
        try {
            const allAgencies = await DB.getAll<Agency>('agencies');
            const pending = allAgencies.filter(a => !a.isApproved).length;
            setPendingAgenciesCount(pending);
        } catch (e) {
            console.error("Erro ao contar agências pendentes");
        }
    };

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams(window.location.search);
                const pathParts = window.location.pathname.split('/').filter(Boolean);
                
                const publicAgencyId = params.get('agency') || params.get('imob') || pathParts[0];

                if (publicAgencyId && publicAgencyId !== 'index.html' && publicAgencyId !== 'index2.html') {
                    const agencies = await DB.getAll<Agency>('agencies', { column: 'id', value: publicAgencyId });
                    if (agencies && agencies.length > 0) {
                        setPublicAgency(agencies[0]);
                        const props = await DB.getAll<Property>('properties', { column: 'agencyId', value: publicAgencyId });
                        setProperties(props);
                        setCurrentView('PUBLIC');
                    } else if (!localStorage.getItem('imob_user_id')) {
                        setCurrentView('LANDING');
                    }
                }

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
                if (savedUserId && !publicAgencyId) {
                    const usrs = await DB.getAll<User>('users', { column: 'id', value: savedUserId });
                    if (usrs && usrs.length > 0) {
                        const user = usrs[0];
                        setCurrentUser(user);
                        const agencies = await DB.getAll<Agency>('agencies', { column: 'id', value: user.agencyId });
                        if (agencies && agencies.length > 0) setCurrentAgency(agencies[0]);
                        if (currentView !== 'PUBLIC') setCurrentView('DASHBOARD');
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
        if (!currentUser) return;
        const load = async () => {
            const agencyId = currentUser.agencyId;
            const [p, l, t, u, f] = await Promise.all([
                DB.getAll<Property>('properties', { column: 'agencyId', value: agencyId }),
                DB.getAll<Lead>('leads', { column: 'agencyId', value: agencyId }),
                DB.getAll<Task>('tasks', { column: 'agencyId', value: agencyId }),
                DB.getAll<User>('users', { column: 'agencyId', value: agencyId }),
                DB.getAll<FinancialRecord>('financial_records', { column: 'agencyId', value: agencyId })
            ]);
            setProperties(p);
            setLeads(l);
            setTasks(t);
            setUsers(u);
            setFinancialRecords(f);
            if (isSuperAdmin) refreshPendingCount();
        };
        load();
    }, [currentUser, isSuperAdmin]);

    useEffect(() => {
        if (!currentUser || tasks.length === 0) return;
        const interval = setInterval(() => {
            const now = new Date();
            const pendingTask = tasks.find(t => !t.completed && new Date(t.dueDate) <= now && !notifiedTaskIds.current.has(t.id));
            if (pendingTask) {
                setNotificationTask(pendingTask);
                notifiedTaskIds.current.add(pendingTask.id);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [currentUser, tasks]);

    const login = async (email: string, password: string): Promise<OperationResult> => {
        const users = await DB.getAll<User>('users', { column: 'email', value: email });
        if (users.length > 0 && users[0].password === password) {
            const user = users[0];
            const agencies = await DB.getAll<Agency>('agencies', { column: 'id', value: user.agencyId });
            if (agencies.length > 0) {
                const agency = agencies[0];
                if (!agency.isApproved && agency.trialExpiresAt && new Date() > new Date(agency.trialExpiresAt)) {
                    return { success: false, message: 'PERÍODO DE TESTE EXPIRADO' };
                }
                setCurrentUser(user);
                setCurrentAgency(agency);
                localStorage.setItem('imob_user_id', user.id);
                setCurrentView('DASHBOARD');
                await DB.updateItem('users', { ...user, loginCount: (user.loginCount || 0) + 1 });
                return { success: true };
            }
        }
        return { success: false, message: 'Credenciais inválidas' };
    };

    const logout = () => {
        setCurrentUser(null);
        setCurrentAgency(null);
        localStorage.removeItem('imob_user_id');
        setCurrentView('LANDING');
    };

    const registerAgency = async (agencyName: string, adminName: string, email: string, phone: string, password: string): Promise<OperationResult> => {
        const agencyId = uuid();
        const trialExpiresAt = new Date();
        trialExpiresAt.setDate(trialExpiresAt.getDate() + 7);
        try {
            await DB.addItem('agencies', { id: agencyId, name: agencyName, trialExpiresAt: trialExpiresAt.toISOString(), isApproved: false });
            await DB.addItem('users', { id: uuid(), name: adminName, email, phone, password, role: 'Admin', agencyId, avatarUrl: `https://ui-avatars.com/api/?name=${adminName}` });
            return { success: true, message: 'Agência registrada com sucesso! Faça login para começar o teste.' };
        } catch (e: any) {
            return { success: false, message: e.message };
        }
    };

    const addProperty = async (property: Property) => {
        const newItem = await DB.addItem<Property>('properties', property);
        setProperties([...properties, newItem]);
    };

    const updateProperty = async (property: Property) => {
        const updated = await DB.updateItem<Property>('properties', property);
        setProperties(properties.map(p => p.id === updated.id ? updated : p));
    };

    const deleteProperty = async (id: string) => {
        await DB.deleteItem('properties', id);
        setProperties(properties.filter(p => p.id !== id));
    };

    const markPropertyAsSold = async (id: string, leadId?: string | null, salePrice?: number, commission?: number, soldByUserId?: string, rentalStartDate?: string, rentalEndDate?: string) => {
        const prop = properties.find(p => p.id === id);
        if (!prop) return;
        const updates: Partial<Property> = { status: 'Sold', soldAt: rentalStartDate || new Date().toISOString(), rentalEndDate, soldToLeadId: leadId || undefined, soldByUserId, salePrice, commissionValue: commission };
        const updated = await DB.updateItem<Property>('properties', { ...prop, ...updates });
        setProperties(properties.map(p => p.id === id ? updated : p));
        if (commission && commission > 0) {
            await DB.addItem('financial_records', { id: uuid(), agencyId: prop.agencyId, propertyId: id, type: prop.type.includes('Locação') ? 'Rental' : 'Sale', value: salePrice || 0, commission, date: updates.soldAt, endDate: rentalEndDate, leadId: leadId || undefined, brokerId: soldByUserId || prop.brokerId });
        }
    };

    const reactivateProperty = async (id: string) => {
        const prop = properties.find(p => p.id === id);
        if (!prop) return;
        const updated = await DB.updateItem<Property>('properties', { ...prop, status: 'Active', soldAt: undefined, rentalEndDate: undefined, soldToLeadId: undefined, salePrice: undefined, commissionValue: undefined });
        setProperties(properties.map(p => p.id === id ? updated : p));
    };

    const renewRental = async (id: string, newRent: number, newComm: number, startDate: string, endDate: string) => {
        const prop = properties.find(p => p.id === id);
        if (!prop) return;
        const updated = await DB.updateItem<Property>('properties', { ...prop, salePrice: newRent, commissionValue: newComm, soldAt: startDate, rentalEndDate: endDate });
        setProperties(properties.map(p => p.id === id ? updated : p));
        await DB.addItem('financial_records', { id: uuid(), agencyId: prop.agencyId, propertyId: id, type: 'Rental', value: newRent, commission: newComm, date: startDate, endDate, leadId: prop.soldToLeadId, brokerId: prop.soldByUserId || prop.brokerId });
    };

    const getNextPropertyCode = () => {
        const codes = properties.map(p => p.code || 0);
        return Math.max(0, ...codes) + 1;
    };

    const addLead = async (lead: Lead) => {
        const newItem = await DB.addItem<Lead>('leads', lead);
        setLeads([...leads, newItem]);
        if (lead.source === 'Site') setNotificationLead(newItem);
    };

    const updateLead = async (lead: Lead) => {
        const updated = await DB.updateItem<Lead>('leads', lead);
        setLeads(leads.map(l => l.id === updated.id ? updated : l));
    };

    const updateLeadStatus = async (id: string, status: LeadStatus) => {
        const lead = leads.find(l => l.id === id);
        if (!lead) return;
        const updated = await DB.updateItem<Lead>('leads', { ...lead, status });
        setLeads(leads.map(l => l.id === id ? updated : l));
    };

    const updateLeadInterestStatus = async (leadId: string, propertyId: string, status: LeadStatus) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;
        
        const interests = [...(lead.interests || [])];
        const interestedInPropertyIds = [...(lead.interestedInPropertyIds || [])];
        
        const idx = interests.findIndex(i => i.propertyId === propertyId);
        if (idx >= 0) {
            interests[idx] = { ...interests[idx], status, updatedAt: new Date().toISOString() };
        } else {
            interests.push({ propertyId, status, updatedAt: new Date().toISOString() });
        }
        
        // Sincroniza interestedInPropertyIds para garantir que o lead seja filtrado corretamente na tela de imóveis
        if (!interestedInPropertyIds.includes(propertyId)) {
            interestedInPropertyIds.push(propertyId);
        }
        
        const updated = await DB.updateItem<Lead>('leads', { ...lead, interests, interestedInPropertyIds });
        setLeads(leads.map(l => l.id === leadId ? updated : l));
    };

    const deleteLead = async (id: string) => {
        await DB.deleteItem('leads', id);
        setLeads(leads.filter(l => l.id !== id));
    };

    const addTask = async (task: Task) => {
        const newItem = await DB.addItem<Task>('tasks', task);
        setTasks([...tasks, newItem]);
    };

    const updateTask = async (task: Task) => {
        const updated = await DB.updateItem<Task>('tasks', task);
        setTasks(tasks.map(t => t.id === updated.id ? updated : t));
    };

    const toggleTaskCompletion = async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        const updated = await DB.updateItem<Task>('tasks', { ...task, completed: !task.completed });
        setTasks(tasks.map(t => t.id === id ? updated : t));
    };

    const deleteTask = async (id: string) => {
        await DB.deleteItem('tasks', id);
        setTasks(tasks.filter(t => t.id !== id));
    };

    const createAgencyUser = async (userData: Partial<User>): Promise<OperationResult> => {
        try {
            const newItem = await DB.addItem<User>('users', { ...userData, id: uuid(), avatarUrl: `https://ui-avatars.com/api/?name=${userData.name}` });
            setUsers([...users, newItem]);
            return { success: true };
        } catch (e: any) {
            return { success: false, message: e.message };
        }
    };

    const updateUser = async (user: User) => {
        try {
            const updated = await DB.updateItem<User>('users', user);
            setUsers(users.map(u => u.id === updated.id ? updated : u));
            if (currentUser?.id === updated.id) setCurrentUser(updated);
            return { success: true };
        } catch (e: any) {
            return { success: false, message: e.message };
        }
    };

    const deleteUser = async (id: string): Promise<OperationResult> => {
        try {
            await DB.deleteItem('users', id);
            setUsers(users.filter(u => u.id !== id));
            return { success: true };
        } catch (e: any) {
            return { success: false, message: e.message };
        }
    };

    const updateAgency = async (agency: Agency) => {
        const updated = await DB.updateItem<Agency>('agencies', agency);
        setCurrentAgency(updated);
    };

    const loadMessages = async (leadId: string) => {
        const m = await DB.getAll<Message>('messages', { column: 'leadId', value: leadId });
        setMessages(m);
    };

    const addMessage = async (msg: any) => {
        const newItem = await DB.addItem<Message>('messages', msg);
        setMessages([...messages, newItem]);
    };

    const dismissNotification = () => {
        setNotificationTask(null);
        setNotificationLead(null);
    };

    const contextValue: AppContextType = {
        currentUser, currentAgency, publicAgency, properties, leads, tasks, users, messages, financialRecords,
        currentView, setCurrentView, authTab, setAuthTab, isLoading, themeColor, setThemeColor, darkMode, setDarkMode,
        login, logout, registerAgency, setAgency: setCurrentAgency, addProperty, updateProperty, deleteProperty,
        markPropertyAsSold, reactivateProperty, renewRental, getNextPropertyCode, addLead, updateLead,
        updateLeadStatus, updateLeadInterestStatus, deleteLead, addTask, updateTask, toggleTaskCompletion,
        deleteTask, createAgencyUser, updateUser, deleteUser, updateAgency, loadMessages, addMessage,
        notificationTask, notificationLead, dismissNotification, aiOpportunities, setAiOpportunities,
        aiStaleLeads, setAiStaleLeads, isSuperAdmin, pendingAgenciesCount, refreshPendingCount
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};
