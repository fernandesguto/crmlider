
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

// Helper para excluir lista de imagens do Storage
export const deleteStorageImages = async (imageUrls: string[]): Promise<void> => {
    if (!imageUrls || imageUrls.length === 0) return;

    // 1. Filtrar apenas imagens que estão no bucket 'imob-images' deste projeto
    // Exemplo de URL: https://xyz.supabase.co/storage/v1/object/public/imob-images/nome-do-arquivo.jpg
    const bucketName = 'imob-images';
    
    const filesToDelete = imageUrls
        .filter(url => url.includes(`/${bucketName}/`)) // Garante que é do nosso bucket
        .map(url => {
            // Extrai o nome do arquivo (tudo depois de imob-images/)
            const parts = url.split(`/${bucketName}/`);
            return parts[1]; // Retorna o caminho do arquivo (ex: '0.1234.jpg')
        })
        .filter(path => !!path); // Remove nulos/vazios

    if (filesToDelete.length === 0) return;

    console.log(`Excluindo ${filesToDelete.length} imagens do Storage...`);

    // 2. Enviar comando de exclusão para o Supabase
    const { error } = await supabase.storage
        .from(bucketName)
        .remove(filesToDelete);

    if (error) {
        console.error('Erro ao excluir imagens do Storage:', error);
    } else {
        console.log('Imagens excluídas com sucesso.');
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
  console.log(`Tentando deletar de ${table} o ID: ${id}...`);
  
  // Método padrão de delete (funciona com Policies RLS configuradas corretamente)
  const { error, count } = await supabase.from(table).delete({ count: 'exact' }).eq('id', id);
  
  if (error) {
    console.error(`ERRO ao deletar de ${table}:`, error);
    
    // Tratamento específico para erro de Foreign Key (Vínculo)
    if (error.code === '23503' || error.message.includes('foreign key')) {
        throw new Error(`BLOQUEIO DE VÍNCULO (Erro 23503): Não é possível excluir este item pois ele está vinculado a outros registros. \n\nSOLUÇÃO: É necessário ajustar as FOREIGN KEYS no Supabase para CASCADE.`);
    }
    
    // Tratamento para erro de Permissão
    if (error.code === '42501') {
        throw new Error(`PERMISSÃO NEGADA (Erro 42501): O banco de dados bloqueou a exclusão. Verifique as Policies (RLS) no Supabase.`);
    }

    throw new Error(`Erro Supabase: ${error.message}`);
  }
  
  // Se não deu erro mas não deletou nada (RLS silencioso ou ID não existe)
  if (count === 0) {
      throw new Error(`NENHUM ITEM APAGADO. Isso geralmente acontece quando o RLS (Row Level Security) está ativo mas não existe uma política de 'DELETE' para a tabela '${table}'. \n\nSOLUÇÃO: Crie uma Policy no Supabase permitindo DELETE.`);
  }
  
  console.log(`Sucesso! Item deletado de ${table}.`);
};

// --- SEED DATABASE MULTI-TENANT ---

export const seedDatabase = async () => {
  // Verifica agências
  const { count, error } = await supabase.from('agencies').select('*', { count: 'exact', head: true });
  
  if (error) {
    console.log("Banco inacessível ou erro de conexão:", error.message);
    return false;
  }
  
  if (count === 0) {
    console.log('Banco vazio. Criando Agências de Exemplo...');
    
    // 1. Criar Agências
    const agency1Id = 'agency-alpha';
    const agency2Id = 'agency-beta';

    await supabase.from('agencies').insert([
        { 
            id: agency1Id, 
            name: 'Imobiliária Alpha', 
            address: 'Av. Paulista, 1000 - São Paulo, SP', 
            phone: '(11) 3333-4444' 
        },
        { 
            id: agency2Id, 
            name: 'Imobiliária Beta',
            address: 'Rua das Flores, 500 - Rio de Janeiro, RJ',
            phone: '(21) 9999-8888'
        }
    ]);

    // 2. Criar Usuários vinculados a Agências (com senha padrão 123456)
    const users = [
      { id: 'u1', name: 'Ana Silva', email: 'ana@alpha.com', password: '123', role: 'Admin', avatarUrl: 'https://picsum.photos/id/64/100/100', agencyId: agency1Id },
      { id: 'u2', name: 'Carlos Oliveira', email: 'carlos@alpha.com', password: '123', role: 'Broker', avatarUrl: 'https://picsum.photos/id/91/100/100', agencyId: agency1Id },
      { id: 'u3', name: 'Beatriz Costa', email: 'bia@beta.com', password: '123', role: 'Admin', avatarUrl: 'https://picsum.photos/id/65/100/100', agencyId: agency2Id },
    ];
    await supabase.from('users').insert(users);

    // 3. Imóveis para Alpha
    const propsAlpha = [
        {
            id: 'p1',
            code: 1,
            title: 'Apartamento Luxo Jardins',
            description: 'Apartamento reformado.',
            type: 'Venda',
            category: 'Residencial',
            subtype: 'Apartamento',
            price: 1500000,
            address: 'Rua Oscar Freire, 1200',
            neighborhood: 'Jardins',
            city: 'São Paulo',
            state: 'SP',
            bedrooms: 3,
            bathrooms: 2,
            area: 120,
            images: ['https://picsum.photos/id/111/800/600', 'https://picsum.photos/id/112/800/600'],
            features: ['Piscina', 'Academia'],
            ownerName: 'Marcos Paulo',
            ownerPhone: '(11) 98765-4321',
            internalNotes: 'Proprietário aceita permuta por imóvel menor.',
            brokerId: 'u1',
            agencyId: agency1Id
        }
    ];
    await supabase.from('properties').insert(propsAlpha);

    // 4. Imóveis para Beta (Alpha não deve ver isso)
    const propsBeta = [
        {
            id: 'p2',
            code: 1,
            title: 'Casa de Campo',
            description: 'Lugar tranquilo.',
            type: 'Venda',
            category: 'Rural',
            subtype: 'Chácara',
            price: 550000,
            address: 'Estrada das Flores, km 5',
            neighborhood: 'Zona Rural',
            city: 'Atibaia',
            state: 'SP',
            bedrooms: 4,
            bathrooms: 3,
            area: 300,
            images: ['https://picsum.photos/id/124/800/600'],
            features: ['Jardim', 'Lareira'],
            ownerName: 'Dona Maria',
            ownerPhone: '(11) 91234-5678',
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
