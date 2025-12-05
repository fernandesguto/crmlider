import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Property, Lead, Task, User, ViewState, PropertyType, LeadStatus } from '../types';

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
  currentUser: User;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mock Data
const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Ana Silva', email: 'ana@imoberp.com', role: 'Admin', avatarUrl: 'https://picsum.photos/id/64/100/100' },
  { id: 'u2', name: 'Carlos Oliveira', email: 'carlos@imoberp.com', role: 'Broker', avatarUrl: 'https://picsum.photos/id/91/100/100' },
];

const MOCK_PROPERTIES: Property[] = [
  {
    id: 'p1',
    title: 'Apartamento Luxo Jardins',
    description: 'Apartamento reformado com vista panorâmica, próximo aos melhores restaurantes.',
    type: PropertyType.SALE,
    price: 1500000,
    address: 'Rua Oscar Freire, 1200, SP',
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    imageUrl: 'https://picsum.photos/id/111/800/600',
    features: ['Piscina', 'Academia', 'Portaria 24h'],
    brokerId: 'u1'
  },
  {
    id: 'p2',
    title: 'Casa de Praia',
    description: 'Casa pé na areia para temporada. Perfeita para famílias.',
    type: PropertyType.RENTAL_SEASONAL,
    price: 850,
    address: 'Av. Atlântica, 50, Guarujá',
    bedrooms: 4,
    bathrooms: 3,
    area: 250,
    imageUrl: 'https://picsum.photos/id/124/800/600',
    features: ['Churrasqueira', 'Wi-Fi', 'Ar Condicionado'],
    brokerId: 'u2'
  },
  {
    id: 'p3',
    title: 'Studio Centro',
    description: 'Studio moderno e compacto, ideal para estudantes e singles.',
    type: PropertyType.RENTAL_ANNUAL,
    price: 2500,
    address: 'Rua Augusta, 500, SP',
    bedrooms: 1,
    bathrooms: 1,
    area: 35,
    imageUrl: 'https://picsum.photos/id/180/800/600',
    features: ['Mobiliado', 'Metrô próximo'],
    brokerId: 'u1'
  }
];

const MOCK_LEADS: Lead[] = [
  {
    id: 'l1',
    name: 'Roberto Souza',
    email: 'roberto@email.com',
    phone: '(11) 99999-9999',
    type: 'Buyer',
    status: LeadStatus.NEW,
    interestedInPropertyIds: ['p1'],
    notes: 'Interessado em permuta.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'l2',
    name: 'Fernanda Lima',
    email: 'fernanda@email.com',
    phone: '(11) 98888-8888',
    type: 'Buyer',
    status: LeadStatus.NEGOTIATION,
    interestedInPropertyIds: ['p3'],
    notes: 'Precisa mudar urgente.',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Ligar para Roberto',
    description: 'Confirmar visita no apto Jardins',
    dueDate: new Date().toISOString().split('T')[0],
    completed: false,
    assignedTo: 'u1'
  },
  {
    id: 't2',
    title: 'Enviar contrato Fernanda',
    description: 'Revisar cláusula de fiador',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    completed: false,
    assignedTo: 'u1'
  }
];

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Using simple state initialization. In a real app, useLocalStorage or API calls would happen here.
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [properties, setProperties] = useState<Property[]>(MOCK_PROPERTIES);
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [users] = useState<User[]>(MOCK_USERS);
  const [currentUser] = useState<User>(MOCK_USERS[0]);

  const addProperty = (property: Property) => {
    setProperties([...properties, property]);
  };

  const deleteProperty = (id: string) => {
    setProperties(properties.filter(p => p.id !== id));
  };

  const addLead = (lead: Lead) => {
    setLeads([lead, ...leads]);
  };

  const updateLeadStatus = (id: string, status: LeadStatus) => {
    setLeads(leads.map(l => l.id === id ? { ...l, status } : l));
  };

  const addTask = (task: Task) => {
    setTasks([...tasks, task]);
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
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
      currentUser
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
