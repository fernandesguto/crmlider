export enum PropertyType {
  SALE = 'Venda',
  RENTAL_ANNUAL = 'Locação Anual',
  RENTAL_SEASONAL = 'Locação Temporada',
}

export enum LeadStatus {
  NEW = 'Novo',
  CONTACTED = 'Contatado',
  VISITING = 'Em Visita',
  NEGOTIATION = 'Em Negociação',
  CLOSED = 'Fechado',
  LOST = 'Perdido',
}

export interface Agency {
  id: string;
  name: string;
  createdAt?: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  price: number;
  address: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[]; // Alterado de imageUrl string para array
  features: string[];
  brokerId: string; // The user managing this property
  agencyId: string; // Multi-tenant ID
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'Buyer' | 'Seller'; // Comprador ou Proprietário
  status: LeadStatus;
  interestedInPropertyIds: string[];
  notes: string;
  createdAt: string;
  agencyId: string; // Multi-tenant ID
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  assignedTo: string; // User ID
  agencyId: string; // Multi-tenant ID
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Campo de senha adicionado
  role: 'Admin' | 'Broker';
  avatarUrl: string;
  agencyId: string; // Multi-tenant ID
}

export type ViewState = 'DASHBOARD' | 'PROPERTIES' | 'LEADS' | 'TASKS' | 'USERS' | 'PUBLIC_SITE';