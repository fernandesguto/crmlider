
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
    } else if (table === 'agencies' && msg.includes('city')) {
            return `ALTER TABLE agencies ADD COLUMN IF NOT EXISTS city text;`;
    } else if (table === 'agencies' && msg.includes('email')) {
            return `ALTER TABLE agencies ADD COLUMN IF NOT EXISTS email text;`;
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
    try {
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
    } catch (e) {
        console.error('Falha de rede ao deletar imagens:', e);
    }
};

export const getAll = async <T>(table: string, filter?: { column: string, value: string }): Promise<T[]> => {
  try {
      let query = supabase.from(table).select('*');
      
      if (filter) {
        query = query.eq(filter.column, filter.value);
      }

      const { data, error } = await query;
      
      if (error) {
        if (table === 'financial_records' && (error.code === '42P01' || error.message.includes('Could not find the table'))) {
            return [];
        }
        console.error(`Erro do Supabase em ${table}:`, error.message || error);
        return [];
      }
      return data as T[] || [];
  } catch (err) {
      console.error(`Falha crítica de rede em ${table}:`, err);
      return [];
  }
};

export const addItem = async <T>(table: string, item: any): Promise<T> => {
  try {
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
                 alert(`ATUALIZAÇÃO NECESSÁRIA:\n\n${sqlSuggestion}`);
            }
        }
        throw error;
      }
      return data as T;
  } catch (err) {
      console.error(`Falha de rede ao adicionar em ${table}:`, err);
      throw err;
  }
};

export const updateItem = async <T>(table: string, item: any): Promise<T> => {
  try {
      const { id, ...updates } = item;
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error(`Erro ao atualizar em ${table}:`, error);
        let errorMsg = typeof error.message === 'string' ? error.message : JSON.stringify(error);
        const sqlSuggestion = getSqlSuggestion(table, errorMsg);
        if (sqlSuggestion) {
             alert(`ATUALIZAÇÃO NECESSÁRIA:\n\n${sqlSuggestion}`);
        }
        throw new Error(error.message);
      }
      return data as T;
  } catch (err) {
      console.error(`Falha de rede ao atualizar em ${table}:`, err);
      throw err;
  }
};

export const deleteItem = async (table: string, id: string): Promise<void> => {
  try {
      const { error, count } = await supabase.from(table).delete({ count: 'exact' }).eq('id', id);
      if (error) throw error;
      if (count === 0) throw new Error(`Nenhum item apago.`);
  } catch (err) {
      console.error(`Falha de rede ao deletar em ${table}:`, err);
      throw err;
  }
};

export const seedDatabase = async () => {
  try {
      const { count, error } = await supabase.from('agencies').select('*', { count: 'exact', head: true });
      if (error) return false;
      if (count > 0) return true;
      
      console.log('Banco vazio. Criando dados de exemplo...');
      const agency1Id = 'agency-alpha';
      await supabase.from('agencies').insert([{ id: agency1Id, name: 'Imobiliária Alpha', address: 'Av. Paulista, 1000', phone: '(11) 3333-4444' }]);
      await supabase.from('users').insert([{ id: 'u1', name: 'Ana Silva', email: 'ana@alpha.com', password: '123', role: 'Admin', avatarUrl: 'https://picsum.photos/id/64/100/100', agencyId: agency1Id }]);
      return true;
  } catch (e) {
      console.warn("Supabase inacessível no momento.");
      return false;
  }
};
