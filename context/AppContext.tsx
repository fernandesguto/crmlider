import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Property, Lead, Task, User, ViewState, LeadStatus, Agency } from '../types';
import * as DB from '../services/db';

interface AppContextType {
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;
  properties: Property[];
  addProperty: (property: Property) => void;
  deleteProperty: (id: string) => void;
  leads: Lead[];
  addLead: (lead: Lead) => void;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  tasks: Task[];
  addTask: (task: Task) => void;
  toggleTaskCompletion: (id: string) => void;
  users: User[];
  currentUser: User | null;
  currentAgency: Agency | null;
  login: (email: string) => Promise<boolean>;
  registerAgency: (agencyName: string, adminName: string, adminEmail: string) => Promise<boolean>;
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
            // Precisamos buscar o usuário globalmente primeiro para saber de qual agência ele é
            // Nota: Em produção real, o Auth do Supabase faria isso via Token.
            // Aqui, faremos uma query direta.
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

  const login = async (email: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        // Busca usuário pelo email (globalmente, pois ainda não sabemos a agência)
        const foundUsers = await DB.getAll<User>('users', { column: 'email', value: email });
        
        if (foundUsers.length > 0) {
            const user = foundUsers[0];
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

  const registerAgency = async (agencyName: string, adminName: string, adminEmail: string): Promise<boolean> => {
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

  const logout = () => {
      setCurrentUser(null);
      setCurrentAgency(null);
      setProperties([]);
      setLeads([]);
      setTasks([]);
      localStorage.removeItem('imob_user_id');
      setCurrentView('DASHBOARD');
  };

  // --- CRUD WRAPPERS (Injetando Agency ID) ---

  const addProperty = async (property: Property) => {
    if (!currentAgency) return;
    const itemWithAgency = { ...property, agencyId: currentAgency.id };
    const saved = await DB.addItem<Property>('properties', itemWithAgency);
    setProperties(prev => [...prev, saved]);
  };

  const deleteProperty = async (id: string) => {
    await DB.deleteItem('properties', id);
    setProperties(prev => prev.filter(p => p.id !== id));
  };

  const addLead = async (lead: Lead) => {
    // Se for lead público (sem currentAgency logado), precisamos tratar diferente ou exigir agencyId na chamada
    // Mas o 'addLead' do context assume contexto logado.
    // Para o PublicPage, vamos ter que passar o agencyId manualmente na chamada do DB ou inferir pelo imóvel.
    
    // CORREÇÃO: Se não tiver usuário logado (público), usamos o agencyId que já veio no objeto lead (setado pela PublicPage)
    // Se tiver usuário logado, forçamos o da agência atual.
    
    const finalAgencyId = currentUser ? currentAgency!.id : lead.agencyId;
    
    if (!finalAgencyId) {
        console.error("Impossível salvar lead sem Agência vinculada");
        return;
    }

    const itemWithAgency = { ...lead, agencyId: finalAgencyId };
    const saved = await DB.addItem<Lead>('leads', itemWithAgency);
    
    // Só atualiza estado local se estivermos logados na mesma agência
    if (currentUser && currentAgency && saved.agencyId === currentAgency.id) {
        setLeads(prev => [saved, ...prev]);
    }
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
      deleteProperty,
      leads,
      addLead,
      updateLeadStatus,
      tasks,
      addTask,
      toggleTaskCompletion,
      users,
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