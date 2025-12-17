
import { supabase } from './supabaseClient.ts';
import { Property, Lead, Task, User, Agency } from '../types.ts';

const getSqlSuggestion = (table: string, errorMsg: string) => {
    const msg = errorMsg.toLowerCase();
    if (msg.includes('interests')) {
            return `ALTER TABLE leads ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]'::jsonb;`;
    } else if (msg.includes('commissiondistribution') || msg.includes('commission_distribution')) {
            return `ALTER TABLE properties ADD COLUMN IF NOT EXISTS "commissionDistribution" JSONB DEFAULT '[]'::jsonb;`;
    } else if (msg.includes('rentalenddate') || msg.includes('rental_end_date')) {
            return `ALTER TABLE properties ADD COLUMN IF NOT EXISTS "rentalEndDate" timestamp with time zone;`;
    } else if (msg.includes('source')) {
            return `ALTER TABLE leads ADD COLUMN IF NOT EXISTS source text;`;
    }
    return '';
}

export const uploadImage = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

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

export const deleteStorageImages = async (imageUrls: string[]): Promise<void> => {
    if (!imageUrls || imageUrls.length === 0) return;

    const bucketName = 'imob-images';
    
    const filesToDelete = imageUrls
        .filter(url => url.includes(`/${bucketName}/`))
        .map(url => {
            const parts = url.split(`/${bucketName}/`);
            return parts[1];
        })
        .filter(path => !!path);

    if (filesToDelete.length === 0) return;

    const { error } = await supabase.storage
        .from(bucketName)
        .remove(filesToDelete);

    if (error) {
        console.error('Erro ao excluir imagens do Storage:', error);
    }
};

export const getAll = async <T>(table: string, filter?: { column: string, value: string }): Promise<T[]> => {
  let query = supabase.from(table).select('*');
  
  if (filter) {
    query = query.eq(filter.column, filter.value);
  }

  const { data, error } = await query;
  
  if (error) {
    // Tratamento específico para a tabela nova financial_records
    if (table === 'financial_records' && (error.code === '42P01' || error.message.includes('Could not find the table'))) {
        console.warn(`[Supabase] Tabela '${table}' não encontrada. O histórico financeiro não será carregado.`);
        console.info(`DICA: Crie a tabela no SQL Editor do Supabase:\n\nCREATE TABLE public.financial_records (\n  id text not null primary key,\n  "agencyId" text null,\n  "propertyId" text null,\n  type text null,\n  value numeric null,\n  commission numeric null,\n  date timestamp with time zone null,\n  "endDate" timestamp with time zone null,\n  "leadId" text null,\n  "brokerId" text null\n);`);
        return [];
    }

    console.error(`Erro ao buscar dados de ${table}:`, error.message || error);
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
    
    let errorMsg = typeof error.message === 'string' ? error.message : JSON.stringify(error);
    const errorCode = error.code || '';

    if (errorCode === '42703' || errorMsg.includes('Could not find the') || errorMsg.includes('does not exist')) {
        const sqlSuggestion = getSqlSuggestion(table, errorMsg);
        if (sqlSuggestion) {
             alert(`ATENÇÃO: ATUALIZAÇÃO DE BANCO NECESSÁRIA\n\nErro ao salvar em '${table}': Coluna faltando.\n\nSOLUÇÃO:\nRode este SQL no Supabase:\n\n${sqlSuggestion}`);
        } else {
             alert(`Erro de Schema no Banco de Dados (${table}):\n\nUma ou mais colunas necessárias não existem. Verifique se o banco está atualizado.\n\nDetalhe: ${errorMsg}`);
        }
    } else if (table === 'financial_records' && (errorCode === '42P01' || errorMsg.includes('Could not find the table'))) {
       console.warn(`[Supabase] Tabela '${table}' não encontrada. Registro histórico não pôde ser salvo.`);
       throw new Error("Tabela de histórico não configurada no banco de dados.");
    }
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
    
    let errorMsg = 'Erro desconhecido';
    if (typeof error.message === 'string') {
        errorMsg = error.message;
    } else {
        try {
            errorMsg = JSON.stringify(error);
        } catch {
            errorMsg = 'Erro crítico de conexão com o banco.';
        }
    }
    
    const errorCode = error.code || '';

    // Detecção de coluna faltando (Erro comum ao adicionar features novas sem migrar DB)
    if (errorCode === '42703' || errorMsg.includes('Could not find the') || errorMsg.includes('does not exist')) {
        const sqlSuggestion = getSqlSuggestion(table, errorMsg);
        const suggestionText = sqlSuggestion ? `\n\nSOLUÇÃO:\nExecute o seguinte SQL no seu Supabase (SQL Editor):\n\n${sqlSuggestion}` : `\n\nVerifique se a coluna mencionada no erro existe na tabela ${table}.`;

        alert(`ATENÇÃO: ATUALIZAÇÃO NECESSÁRIA NO BANCO DE DADOS\n\nO sistema tentou salvar dados em uma coluna que ainda não existe na tabela '${table}'.\n\nErro: ${errorMsg}${suggestionText}`);
    }
    
    throw new Error(errorMsg);
  }
  return data as T;
};

export const deleteItem = async (table: string, id: string): Promise<void> => {
  const { error, count } = await supabase.from(table).delete({ count: 'exact' }).eq('id', id);
  
  if (error) {
    console.error(`ERRO ao deletar de ${table}:`, error);
    
    if (error.code === '23503' || error.message.includes('foreign key')) {
        throw new Error(`BLOQUEIO DE VÍNCULO (Erro 23503): Não é possível excluir este item pois ele está vinculado a outros registros.`);
    }
    
    if (error.code === '42501') {
        throw new Error(`PERMISSÃO NEGADA (Erro 42501): O banco de dados bloqueou a exclusão.`);
    }

    throw new Error(`Erro Supabase: ${error.message}`);
  }
  
  if (count === 0) {
      throw new Error(`NENHUM ITEM APAGADO.`);
  }
};

export const seedDatabase = async () => {
  const { count, error } = await supabase.from('agencies').select('*', { count: 'exact', head: true });
  
  if (error) {
    console.log("Banco inacessível ou erro de conexão:", error.message);
    return false;
  }
  
  if (count === 0) {
    console.log('Banco vazio. Criando dados de exemplo...');
    
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

    const users = [
      { id: 'u1', name: 'Ana Silva', email: 'ana@alpha.com', password: '123', role: 'Admin', avatarUrl: 'https://picsum.photos/id/64/100/100', agencyId: agency1Id },
      { id: 'u2', name: 'Carlos Oliveira', email: 'carlos@alpha.com', password: '123', role: 'Broker', avatarUrl: 'https://picsum.photos/id/91/100/100', agencyId: agency1Id },
      { id: 'u3', name: 'Beatriz Costa', email: 'bia@beta.com', password: '123', role: 'Admin', avatarUrl: 'https://picsum.photos/id/65/100/100', agencyId: agency2Id },
    ];
    await supabase.from('users').insert(users);

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
            internalNotes: 'Proprietário aceita permuta.',
            brokerId: 'u1',
            agencyId: agency1Id
        }
    ];
    await supabase.from('properties').insert(propsAlpha);

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
