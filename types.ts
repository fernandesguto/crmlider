
export enum PropertyType {
  SALE = 'Venda',
  RENTAL_ANNUAL = 'Locação Anual',
  RENTAL_SEASONAL = 'Locação Temporada',
}

export type PropertyCategory = 'Residencial' | 'Comercial' | 'Industrial';

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
  isApproved?: boolean; // Controle de liberação
  trialExpiresAt?: string; // Data de expiração do teste grátis
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
  soldByUserId?: string; // ID do Corretor que vendeu
  salePrice?: number; // Valor final que foi fechado o negócio (Aluguel mensal ou Venda Total)
  commissionValue?: number; // Valor da comissão recebida

  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  features: string[];
  brokerId: string;
  agencyId: string;
}

export interface FinancialRecord {
    id: string;
    agencyId: string;
    propertyId: string;
    type: 'Sale' | 'Rental';
    value: number; // Valor da Venda ou Aluguel
    commission: number; // Comissão
    date: string; // Data da Venda ou Início do Contrato
    endDate?: string; // Data Fim do Contrato (Apenas para Locação encerrada)
    leadId?: string;
    brokerId?: string;
}

export interface LeadInterest {
    propertyId: string;
    status: LeadStatus;
    updatedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'Buyer' | 'Seller';
  status: LeadStatus; // Status Global (Calculado ou Manual)
  interestedInPropertyIds: string[]; // Mantido para busca rápida, mas o detalhe está em interests
  interests?: LeadInterest[]; // Nova estrutura detalhada
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
  phone?: string; // Telefone do usuário (Admin)
  role: 'Admin' | 'Broker';
  avatarUrl: string;
  agencyId: string;
  loginCount?: number; // Total de acessos
}

export interface Message {
  id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  leadId: string;
  createdAt: string;
  agencyId: string;
}

export interface OperationResult {
    success: boolean;
    message?: string;
}

export interface AiMatchOpportunity {
    leadId: string;
    propertyId: string;
    matchScore: number; // 0 a 100
    reason: string;
    suggestedAction: string;
    status?: 'pending' | 'accepted' | 'dismissed';
}

export interface AiStaleLeadOpportunity {
    leadId: string;
    daysInactive: number;
    currentStatus: string;
    analysis: string;
    reactivationMessage: string;
}

export type ViewState = 'LANDING' | 'DASHBOARD' | 'PROPERTIES' | 'LEADS' | 'TASKS' | 'USERS' | 'SETTINGS' | 'PUBLIC' | 'RENTALS' | 'SALES' | 'SUPER_ADMIN' | 'AI_MATCHING';
