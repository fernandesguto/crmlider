import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Property, Lead, Task, User, ViewState, LeadStatus, Agency } from '../types';
import * as DB from '../services/db';

interface AppContextType {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  properties: Property[];
  addProperty: (property: Property) => void;
  updateProperty: (property: Property) => Promise<void>;
  deleteProperty: (id: string) => void;
  leads: Lead[];
  addLead: (lead: Lead) => void;
  updateLead: (lead: Lead) => Promise<void>;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  tasks: Task[];
  addTask: (task: Task) => void;
  toggleTaskCompletion: (id: string) => void;
  users: User[];
  createAgencyUser: (user: Partial<User>) => Promise<boolean>;
  updateUser: (user: User) => Promise<boolean>;
  currentUser: User | null;
  currentAgency: Agency | null;
  login: (email: string, password?: string) => Promise<boolean>;
  registerAgency: (agencyName: string, adminName: string, adminEmail: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Apenas usuários da agência
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAgency, setCurrentAgency] = useState<Agency | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);

  // Inicialização: Verifica seed e sessão salva
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      try {
        await DB.seedDatabase(); // Cria dados mock se estiver vazio
        
        // Tenta recuperar sessão
        const savedUserId = localStorage.getItem('imob_user_id');
        if (savedUserId) {
            // Busca o usuário pelo ID
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

  // Função central para carregar dados da agência do usuário
  const loadAgencyData = async (user: User) => {
      // 1. Busca a Agência
      const agencies = await DB.getAll<Agency>('agencies', { column: 'id', value: user.agencyId });
      if (agencies.length === 0) return false;
      const agency = agencies[0];

      // 2. Busca dados filtrados pela Agência
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
        // Busca usuário pelo email
        const foundUsers = await DB.getAll<User>('users', { column: 'email', value: email });
        
        if (foundUsers.length > 0) {
            const user = foundUsers[0];
            
            // Verificação simples de senha (em produção usaríamos hash/bcrypt)
            if (password && user.password && user.password !== password) {
                console.warn("Senha incorreta");
                setIsLoading(false);
                return false;
            }

            await loadAgencyData(user);
            setIsLoading(false);
            return true;
        }
      } catch (e) {
          console.error(e);
      }
      setIsLoading(false);
      return false;
  };

  const registerAgency = async (agencyName: string, adminName: string, adminEmail: string, password?: string): Promise<boolean> => {
      setIsLoading(true);
      try {
          // 1. Criar Agência
          const newAgency: Agency = {
              id: crypto.randomUUID(),
              name: agencyName,
              createdAt: new Date().toISOString()
          };
          await DB.addItem<Agency>('agencies', newAgency);

          // 2. Criar Admin
          const newAdmin: User = {
              id: crypto.randomUUID(),
              name: adminName,
              email: adminEmail,
              password: password || '123456', // Salva a senha
              role: 'Admin',
              avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=random`,
              agencyId: newAgency.id
          };
          await DB.addItem<User>('users', newAdmin);

          // 3. Logar
          await loadAgencyData(newAdmin);
          setIsLoading(false);
          return true;
      } catch (error) {
          console.error("Erro ao registrar agência", error);
          setIsLoading(false);
          return false;
      }
  };

  const createAgencyUser = async (userData: Partial<User>): Promise<boolean> => {
      if (!currentAgency || !currentUser) return false;
      
      try {
          const newUser: User = {
              id: crypto.randomUUID(),
              name: userData.name!,
              email: userData.email!,
              password: userData.password!,
              role: userData.role || 'Broker',
              avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || '')}&background=random`,
              agencyId: currentAgency.id
          };

          const savedUser = await DB.addItem<User>('users', newUser);
          setUsers(prev => [...prev, savedUser]);
          return true;
      } catch (error) {
          console.error("Erro ao criar usuário", error);
          return false;
      }
  };

  const updateUser = async (user: User): Promise<boolean> => {
      try {
          const updated = await DB.updateItem<User>('users', user);
          setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
          return true;
      } catch (error) {
          console.error("Erro ao atualizar usuário", error);
          return false;
      }
  };

  const logout = () => {
      setCurrentUser(null);
      setCurrentAgency(null);
      setProperties([]);
      setLeads([]);
      setTasks([]);
      localStorage.removeItem('imob_user_id');
      setCurrentView('DASHBOARD');
  };

  // --- CRUD WRAPPERS ---

  const addProperty = async (property: Property) => {
    if (!currentAgency) return;
    const itemWithAgency = { ...property, agencyId: currentAgency.id };
    const saved = await DB.addItem<Property>('properties', itemWithAgency);
    setProperties(prev => [...prev, saved]);
  };

  const updateProperty = async (property: Property) => {
    const updated = await DB.updateItem<Property>('properties', property);
    setProperties(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const deleteProperty = async (id: string) => {
    await DB.deleteItem('properties', id);
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const addLead = async (lead: Lead) => {
    const finalAgencyId = currentUser ? currentAgency!.id : lead.agencyId;
    
    if (!finalAgencyId) {
        console.error("Impossível salvar lead sem Agência vinculada");
        return;
    }

    const itemWithAgency = { ...lead, agencyId: finalAgencyId };
    const saved = await DB.addItem<Lead>('leads', itemWithAgency);
    
    if (currentUser && currentAgency && saved.agencyId === currentAgency.id) {
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

  const addTask = async (task: Task) => {
    if (!currentAgency) return;
    const itemWithAgency = { ...task, agencyId: currentAgency.id };
    const saved = await DB.addItem<Task>('tasks', itemWithAgency);
    setTasks(prev => [...prev, saved]);
  };

  const toggleTaskCompletion = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const updated = { ...task, completed: !task.completed };
      await DB.updateItem('tasks', updated);
      setTasks(prev => prev.map(t => t.id === id ? updated : t));
    }
  };

  return (
    <AppContext.Provider value={{
      currentView,
      setCurrentView,
      properties,
      addProperty,
      updateProperty,
      deleteProperty,
      leads,
      addLead,
      updateLead,
      updateLeadStatus,
      tasks,
      addTask,
      toggleTaskCompletion,
      users,
      createAgencyUser,
      updateUser,
      currentUser,
      currentAgency,
      login,
      registerAgency,
      logout,
      isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};