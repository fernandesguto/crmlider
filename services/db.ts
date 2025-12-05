import { supabase } from './supabaseClient';
import { Property, Lead, Task, User, Agency } from '../types';

// Tabelas no Supabase devem se chamar: 'properties', 'leads', 'tasks', 'users', 'agencies'

// Helper para fazer upload de imagem para o Supabase Storage
export const uploadImage = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload para um bucket chamado 'imob-images'
    const { error: uploadError } = await supabase.storage
      .from('imob-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('imob-images').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error('Erro ao processar imagem:', error);
    return null;
  }
};

// Updated getAll to accept optional filter
export const getAll = async <T>(table: string, filter?: { column: string, value: string }): Promise<T[]> => {
  let query = supabase.from(table).select('*');
  
  if (filter) {
    query = query.eq(filter.column, filter.value);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error(`Erro ao buscar dados de ${table}.`, error.message);
    return [];
  }
  return data as T[];
};

export const addItem = async <T>(table: string, item: any): Promise<T> => {
  const { data, error } = await supabase
    .from(table)
    .insert([item])
    .select()
    .single();

  if (error) {
    console.error(`Erro ao inserir em ${table}:`, error);
    throw error;
  }
  return data as T;
};

export const updateItem = async <T>(table: string, item: any): Promise<T> => {
  const { id, ...updates } = item;
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Erro ao atualizar em ${table}:`, error);
    throw error;
  }
  return data as T;
};

export const deleteItem = async (table: string, id: string): Promise<void> => {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    console.error(`Erro ao deletar de ${table}:`, error);
    throw error;
  }
};

// --- SEED DATABASE MULTI-TENANT ---

export const seedDatabase = async () => {
  // Verifica agências
  const { count, error } = await supabase.from('agencies').select('*', { count: 'exact', head: true });
  
  if (error) {
    console.error("Falha ao conectar com Supabase:", error.message);
    return false;
  }
  
  if (count === 0) {
    console.log('Banco vazio. Criando Agências de Exemplo...');
    
    // 1. Criar Agências
    const agency1Id = 'agency-alpha';
    const agency2Id = 'agency-beta';

    await supabase.from('agencies').insert([
        { id: agency1Id, name: 'Imobiliária Alpha' },
        { id: agency2Id, name: 'Imobiliária Beta' }
    ]);

    // 2. Criar Usuários vinculados a Agências
    const users = [
      { id: 'u1', name: 'Ana Silva', email: 'ana@alpha.com', role: 'Admin', avatarUrl: 'https://picsum.photos/id/64/100/100', agencyId: agency1Id },
      { id: 'u2', name: 'Carlos Oliveira', email: 'carlos@alpha.com', role: 'Broker', avatarUrl: 'https://picsum.photos/id/91/100/100', agencyId: agency1Id },
      { id: 'u3', name: 'Beatriz Costa', email: 'bia@beta.com', role: 'Admin', avatarUrl: 'https://picsum.photos/id/65/100/100', agencyId: agency2Id },
    ];
    await supabase.from('users').insert(users);

    // 3. Imóveis para Alpha
    const propsAlpha = [
        {
            id: 'p1',
            title: 'Apartamento Luxo Jardins',
            description: 'Apartamento reformado.',
            type: 'Venda',
            price: 1500000,
            address: 'Rua Oscar Freire, 1200, SP',
            bedrooms: 3,
            bathrooms: 2,
            area: 120,
            imageUrl: 'https://picsum.photos/id/111/800/600',
            features: ['Piscina', 'Academia'],
            brokerId: 'u1',
            agencyId: agency1Id
        }
    ];
    await supabase.from('properties').insert(propsAlpha);

    // 4. Imóveis para Beta (Alpha não deve ver isso)
    const propsBeta = [
        {
            id: 'p2',
            title: 'Casa de Campo',
            description: 'Lugar tranquilo.',
            type: 'Venda',
            price: 550000,
            address: 'Interior de SP',
            bedrooms: 4,
            bathrooms: 3,
            area: 300,
            imageUrl: 'https://picsum.photos/id/124/800/600',
            features: ['Jardim', 'Lareira'],
            brokerId: 'u3',
            agencyId: agency2Id
        }
    ];
    await supabase.from('properties').insert(propsBeta);

    // 5. Leads
    await supabase.from('leads').insert([
         {
            id: 'l1',
            name: 'Roberto Souza',
            email: 'roberto@email.com',
            phone: '(11) 99999-9999',
            type: 'Buyer',
            status: 'Novo',
            interestedInPropertyIds: ['p1'],
            agencyId: agency1Id
         }
    ]);

    return true;
  }
  return false;
};