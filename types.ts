
export enum PropertyType {
  SALE = 'Venda',
  RENTAL_ANNUAL = 'Locação Anual',
  RENTAL_SEASONAL = 'Locação Temporada',
}

export type PropertyCategory = 'Residencial' | 'Comercial' | 'Terreno / Área' | 'Rural' | 'Industrial';

export type PropertySubtype = 'Casa' | 'Apartamento' | 'Sala' | 'Loja' | 'Prédio' | 'Galpão' | 'Terreno' | 'Chácara';

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
  logoUrl?: string;
  address?: string; 
  phone?: string;   
}

export interface Property {
  id: string;
  code?: number; // Código sequencial (ex: 1, 2, 3...)
  title: string;
  description: string;
  type: PropertyType; // Venda ou Locação
  category: PropertyCategory; 
  subtype: PropertySubtype; 
  price: number;
  
  // Localização
  address: string; // Logradouro / Rua
  neighborhood?: string; // Bairro
  city?: string; // Cidade
  state?: string; // Estado (UF)

  // Dados do Proprietário e Internos
  ownerName?: string;
  ownerPhone?: string;
  internalNotes?: string;

  // Status de Venda e Financeiro
  status?: 'Active' | 'Sold';
  soldAt?: string;
  soldToLeadId?: string; // ID do Lead se vendido internamente
  salePrice?: number; // Valor final que foi fechado o negócio
  commissionValue?: number; // Valor da comissão recebida

  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  features: string[];
  brokerId: string;
  agencyId: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'Buyer' | 'Seller';
  status: LeadStatus;
  interestedInPropertyIds: string[];
  notes: string;
  createdAt: string;
  agencyId: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  assignedTo: string;
  leadId?: string;
  propertyId?: string; // Imóvel vinculado
  agencyId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Broker';
  avatarUrl: string;
  agencyId: string;
}

export type ViewState = 'DASHBOARD' | 'PROPERTIES' | 'LEADS' | 'TASKS' | 'USERS' | 'SETTINGS' | 'PUBLIC' | 'RENTALS';
