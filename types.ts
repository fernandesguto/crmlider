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
  imageUrl: string;
  features: string[];
  brokerId: string; // The user managing this property
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
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  assignedTo: string; // User ID
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Broker';
  avatarUrl: string;
}

export type ViewState = 'DASHBOARD' | 'PROPERTIES' | 'LEADS' | 'TASKS' | 'USERS' | 'PUBLIC_SITE';
