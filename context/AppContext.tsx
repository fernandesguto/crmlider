
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Property, Lead, Task, User, ViewState, LeadStatus, Agency } from '../types';
import * as DB from '../services/db';

interface OperationResult {
    success: boolean;
    message?: string;
}

interface AppContextType {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  properties: Property[];
  addProperty: (property: Property) => void;
  updateProperty: (property: Property) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;
  markPropertyAsSold: (propertyId: string, leadId?: string | null, salePrice?: number, commissionValue?: number) => Promise<void>;
  reactivateProperty: (propertyId: string) => Promise<void>;
  readjustRental: (propertyId: string, newRent: number, newCommission: number, effectiveDate: string) => Promise<void>;
  getNextPropertyCode: () => number;
  leads: Lead[];
  addLead: (lead: Lead) => Promise<void>;
  updateLead: (lead: Lead) => Promise<void>;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  deleteLead: (id: string) => Promise<void>;
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (task: Task) => Promise<void>;
  toggleTaskCompletion: (id: string) => void;
  deleteTask: (id: string) => Promise<void>;
  users: User[];
  createAgencyUser: (user: Partial<User>) => Promise<OperationResult>;
  updateUser: (user: User) => Promise<OperationResult>;
  deleteUser: (id: string) => Promise<OperationResult>;
  currentUser: User | null;
  currentAgency: Agency | null;
  updateAgency: (agency: Agency) => Promise<void>;
  login: (email: string, password?: string) => Promise<boolean>;
  registerAgency: (agencyName: string, adminName: string, adminEmail: string, password?: string) => Promise<OperationResult>;
  logout: () => void;
  isLoading: boolean;
  // Notificações
  notificationTask: Task | null;
  notificationLead: Lead | null;
  dismissNotification: () => void;
  // Theme
  themeColor: string;
  darkMode: boolean;
  setThemeColor: (color: string) => void;
  setDarkMode: (enabled: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]); 
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAgency, setCurrentAgency] = useState<Agency | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);

  // Notificações
  const [notificationTask, setNotificationTask] = useState<Task | null>(null);
  const [notificationLead, setNotificationLead] = useState<Lead | null>(null);
  const [notifiedTaskIds, setNotifiedTaskIds] = useState<Set<string>>(new Set());
  const [notifiedLeadIds, setNotifiedLeadIds] = useState<Set<string>>(new Set());
  
  // Theme State
  const [themeColor, setThemeColor] = useState<string>('#3b82f6');
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Inicialização
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        await DB.seedDatabase();
        
        const savedTheme = localStorage.getItem('imob_theme_color');
        if (savedTheme) setThemeColor(savedTheme);
        
        const savedDarkMode = localStorage.getItem('imob_dark_mode');
        if (savedDarkMode === 'true') setDarkMode(true);

        const savedUserId = localStorage.getItem('imob_user_id');
        if (savedUserId) {
            const allUsers = await DB.getAll<User>('users', { column: 'id', value: savedUserId });
            if (allUsers.length > 0) {
                const user = allUsers[0];
                await loadAgencyData(user);
            }
        }
      } catch (error) {
        console.error("Erro na inicialização", error);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  const handleSetThemeColor = (color: string) => {
      setThemeColor(color);
      localStorage.setItem('imob_theme_color', color);
  };

  const handleSetDarkMode = (enabled: boolean) => {
      setDarkMode(enabled);
      localStorage.setItem('imob_dark_mode', String(enabled));
  };

  // --- MONITORAMENTO DE TAREFAS ---
  useEffect(() => {
    if (!currentUser || tasks.length === 0) return;

    const checkTasks = () => {
      const now = new Date();
      
      tasks.forEach(task => {
        if (task.completed || notifiedTaskIds.has(task.id)) return;

        const taskDate = new Date(task.dueDate);
        const timeDiff = taskDate.getTime() - now.getTime();

        // Notifica se a tarefa é para agora (ou passou faz 1 minuto)
        if (timeDiff <= 0 && timeDiff > -60000) {
            setNotificationTask(task);
            setNotifiedTaskIds(prev => new Set(prev).add(task.id));
            try { new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(() => {}); } catch (e) {}
        }
      });
    };

    const intervalId = setInterval(checkTasks, 30000); // 30s
    return () => clearInterval(intervalId);
  }, [tasks, currentUser, notifiedTaskIds]);

  // --- MONITORAMENTO DE NOVOS LEADS (POLLING) ---
  useEffect(() => {
      if (!currentAgency || !currentUser) return;

      const checkNewLeads = async () => {
          try {
              // Busca leads da agência
              const fetchedLeads = await DB.getAll<Lead>('leads', { column: 'agencyId', value: currentAgency.id });
              
              // Atualiza lista global se houver diferença
              if (fetchedLeads.length !== leads.length) {
                  setLeads(fetchedLeads);
              }

              // Verifica se tem algum lead NOVO criado nos últimos 30 segundos
              const now = new Date();
              const recentLeads = fetchedLeads.filter(l => {
                  if (notifiedLeadIds.has(l.id)) return false; // Já notificado
                  
                  const created = new Date(l.createdAt);
                  const diffSeconds = (now.getTime() - created.getTime()) / 1000;
                  
                  // Se foi criado há menos de 40 segundos e ainda não vimos
                  return diffSeconds < 40 && diffSeconds >= 0;
              });

              if (recentLeads.length > 0) {
                  const newestLead = recentLeads[0]; // Pega o mais recente
                  setNotificationLead(newestLead);
                  setNotifiedLeadIds(prev => new Set(prev).add(newestLead.id));
                  
                  // Som de Notificação
                  try { new Audio('https://actions.google.com/sounds/v1/science_fiction/scifi_laser.ogg').play().catch(() => {}); } catch (e) {}
              }

          } catch (error) {
              console.error("Erro ao verificar novos leads", error);
          }
      };

      // Roda a cada 15 segundos para pegar leads quase em tempo real
      const intervalId = setInterval(checkNewLeads, 15000);
      return () => clearInterval(intervalId);
  }, [currentAgency, currentUser, leads, notifiedLeadIds]);


  const loadAgencyData = async (user: User) => {
      const agencies = await DB.getAll<Agency>('agencies', { column: 'id', value: user.agencyId });
      if (agencies.length === 0) return false;
      const agency = agencies[0];

      const [dbProps, dbLeads, dbTasks, dbUsers] = await Promise.all([
          DB.getAll<Property>('properties', { column: 'agencyId', value: agency.id }),
          DB.getAll<Lead>('leads', { column: 'agencyId', value: agency.id }),
          DB.getAll<Task>('tasks', { column: 'agencyId', value: agency.id }),
          DB.getAll<User>('users', { column: 'agencyId', value: agency.id })
      ]);

      setProperties(dbProps);
      setLeads(dbLeads);
      setTasks(dbTasks);
      setUsers(dbUsers);
      
      setCurrentUser(user);
      setCurrentAgency(agency);
      localStorage.setItem('imob_user_id', user.id);
      return true;
  };

  const login = async (email: string, password?: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        const foundUsers = await DB.getAll<User>('users', { column: 'email', value: email });
        if (foundUsers.length > 0) {
            const user = foundUsers[0];
            if (password && user.password && user.password !== password) {
                setIsLoading(false);
                return false;
            }
            await loadAgencyData(user);
            setIsLoading(false);
            return true;
        }
      } catch (e) { console.error(e); }
      setIsLoading(false);
      return false;
  };

  const uuid = () => {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
      });
  };

  const registerAgency = async (agencyName: string, adminName: string, adminEmail: string, password?: string): Promise<OperationResult> => {
      setIsLoading(true);
      try {
          // Check for existing user email globally before starting
          const existingUsers = await DB.getAll<User>('users', { column: 'email', value: adminEmail });
          if (existingUsers.length > 0) {
              setIsLoading(false);
              return { success: false, message: 'Este e-mail já está cadastrado.' };
          }

          const newAgency: Agency = { id: uuid(), name: agencyName, createdAt: new Date().toISOString() };
          await DB.addItem<Agency>('agencies', newAgency);

          const newAdmin: User = {
              id: uuid(),
              name: adminName,
              email: adminEmail,
              password: password || '123456',
              role: 'Admin',
              avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=random`,
              agencyId: newAgency.id
          };
          await DB.addItem<User>('users', newAdmin);
          await loadAgencyData(newAdmin);
          setIsLoading(false);
          return { success: true };
      } catch (error: any) {
          setIsLoading(false);
          if (error.code === '23505') return { success: false, message: 'Este e-mail já está cadastrado.' };
          return { success: false, message: error.message || 'Erro ao criar conta.' };
      }
  };

  const createAgencyUser = async (userData: Partial<User>): Promise<OperationResult> => {
      if (!currentAgency) return { success: false, message: 'Sessão inválida' };
      
      // Verificação manual de duplicidade (para feedback imediato)
      const existing = users.find(u => u.email.toLowerCase() === userData.email?.toLowerCase());
      if (existing) return { success: false, message: 'E-mail já está em uso na equipe.' };

      // Verificação Global (banco)
      try {
          const globalCheck = await DB.getAll<User>('users', { column: 'email', value: userData.email! });
          if (globalCheck.length > 0) return { success: false, message: 'Este e-mail já está cadastrado no sistema.' };

          const newUser: User = {
              id: uuid(),
              name: userData.name!,
              email: userData.email!,
              password: userData.password!,
              role: userData.role || 'Broker',
              avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || '')}&background=random`,
              agencyId: currentAgency.id
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
      const existing = users.find(u => u.email.toLowerCase() === user.email.toLowerCase() && u.id !== user.id);
      if (existing) return { success: false, message: 'E-mail já está em uso por outro usuário.' };

      try {
          const updated = await DB.updateItem<User>('users', user);
          setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
          return { success: true };
      } catch (error: any) {
          if (error.code === '23505') return { success: false, message: 'Este e-mail já está em uso.' };
          return { success: false, message: error.message };
      }
  };

  const deleteUser = async (id: string): Promise<OperationResult> => {
      try {
          await DB.deleteItem('users', id);
          setUsers(prev => prev.filter(u => u.id !== id));
          return { success: true };
      } catch (error: any) {
          return { success: false, message: error.message };
      }
  };

  const updateAgency = async (agency: Agency) => {
      try {
          const updated = await DB.updateItem<Agency>('agencies', agency);
          setCurrentAgency(updated);
      } catch (e) { alert('Erro ao salvar agência.'); }
  };

  const logout = () => {
      localStorage.removeItem('imob_user_id');
      window.location.reload();
  };

  const getNextPropertyCode = () => {
      if (properties.length === 0) return 1;
      const maxCode = Math.max(...properties.map(p => p.code || 0));
      return maxCode + 1;
  };

  const addProperty = async (property: Property) => {
    if (!currentAgency) return;
    const nextCode = getNextPropertyCode();
    const itemWithAgency = { ...property, code: nextCode, status: 'Active', agencyId: currentAgency.id };
    const saved = await DB.addItem<Property>('properties', itemWithAgency);
    setProperties(prev => [...prev, saved]);
  };

  const updateProperty = async (property: Property) => {
    const updated = await DB.updateItem<Property>('properties', property);
    setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const deleteProperty = async (id: string) => {
    const propertyToDelete = properties.find(p => p.id === id);
    try {
        await DB.deleteItem('properties', id);
        if (propertyToDelete?.images?.length) DB.deleteStorageImages(propertyToDelete.images).catch(console.warn);
        setProperties(prev => prev.filter(p => p.id !== id));
    } catch (e: any) { alert(`ERRO AO EXCLUIR: ${e.message}`); }
  };

  const markPropertyAsSold = async (propertyId: string, leadId?: string | null, salePrice?: number, commissionValue?: number) => {
      const property = properties.find(p => p.id === propertyId);
      if (!property) return;
      const updatedProp = { ...property, status: 'Sold' as const, soldAt: new Date().toISOString(), soldToLeadId: leadId || undefined, salePrice: salePrice || 0, commissionValue: commissionValue || 0 };
      await updateProperty(updatedProp);
      if (leadId) {
          const lead = leads.find(l => l.id === leadId);
          if (lead) await updateLead({ ...lead, status: LeadStatus.CLOSED });
      }
  };

  const reactivateProperty = async (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;
    const updatedProp = { ...property, status: 'Active' as const, soldAt: null, soldToLeadId: null, salePrice: null, commissionValue: null };
    await DB.updateItem('properties', updatedProp);
    setProperties(prev => prev.map(p => p.id === propertyId ? updatedProp : p));
  };

  const readjustRental = async (propertyId: string, newRent: number, newCommission: number, effectiveDate: string) => {
      const property = properties.find(p => p.id === propertyId);
      if (!property) return;

      const oldRent = property.salePrice || 0;
      const oldComm = property.commissionValue || 0;
      const dateFormatted = new Date(effectiveDate).toLocaleDateString('pt-BR');

      const logMessage = `\n[${dateFormatted}] Reajuste: Aluguel R$${oldRent} -> R$${newRent} | Comissão R$${oldComm} -> R$${newCommission}`;
      const newNotes = (property.internalNotes || '') + logMessage;

      const updatedProp = { 
          ...property, 
          salePrice: newRent, 
          commissionValue: newCommission,
          internalNotes: newNotes
      };

      await updateProperty(updatedProp);
  };

  const addLead = async (lead: Lead) => {
    const finalAgencyId = currentUser ? currentAgency!.id : lead.agencyId;
    if (!finalAgencyId) return;
    const itemWithAgency = { ...lead, agencyId: finalAgencyId };
    const saved = await DB.addItem<Lead>('leads', itemWithAgency);
    // Atualiza estado apenas se a agência for a mesma (para o user logado)
    if (currentAgency && saved.agencyId === currentAgency.id) {
        setLeads(prev => [saved, ...prev]);
    }
  };

  const updateLead = async (lead: Lead) => {
      const updated = await DB.updateItem<Lead>('leads', lead);
      setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
  };

  const updateLeadStatus = async (id: string, status: LeadStatus) => {
    const lead = leads.find(l => l.id === id);
    if (lead) {
      const updated = { ...lead, status };
      await DB.updateItem('leads', updated);
      setLeads(prev => prev.map(l => l.id === id ? updated : l));
    }
  };

  const deleteLead = async (id: string) => {
      try {
          await DB.deleteItem('leads', id);
          setLeads(prev => prev.filter(l => l.id !== id));
      } catch (e: any) { alert(`ERRO: ${e.message}`); }
  };

  const addTask = async (task: Task) => {
    if (!currentAgency) return;
    const itemWithAgency = { ...task, agencyId: currentAgency.id };
    const saved = await DB.addItem<Task>('tasks', itemWithAgency);
    setTasks(prev => [...prev, saved]);
  };

  const updateTask = async (task: Task) => {
      const updated = await DB.updateItem<Task>('tasks', task);
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const toggleTaskCompletion = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const updated = { ...task, completed: !task.completed };
      await DB.updateItem('tasks', updated);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    }
  };

  const deleteTask = async (id: string) => {
    try {
        await DB.deleteItem('tasks', id);
        setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e: any) { alert(`ERRO: ${e.message}`); }
  };
  
  const dismissNotification = () => {
      setNotificationTask(null);
      setNotificationLead(null);
  };

  return (
    <AppContext.Provider value={{
      currentView, setCurrentView, properties, addProperty, updateProperty, deleteProperty, markPropertyAsSold, reactivateProperty, readjustRental, getNextPropertyCode,
      leads, addLead, updateLead, updateLeadStatus, deleteLead, tasks, addTask, updateTask, toggleTaskCompletion, deleteTask,
      users, createAgencyUser, updateUser, deleteUser, currentUser, currentAgency, updateAgency, login, registerAgency, logout,
      isLoading, 
      notificationTask, notificationLead, dismissNotification, 
      themeColor, setThemeColor: handleSetThemeColor, darkMode, setDarkMode: handleSetDarkMode
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
