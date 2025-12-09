import { supabase } from './supabaseClient';

export const uploadImage = async (file) => {
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

export const deleteStorageImages = async (imageUrls) => {
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

export const getAll = async (table, filter) => {
  let query = supabase.from(table).select('*');
  
  if (filter) {
    query = query.eq(filter.column, filter.value);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error(`Erro ao buscar dados de ${table}.`, error.message);
    return [];
  }
  return data;
};

export const addItem = async (table, item) => {
  const { data, error } = await supabase
    .from(table)
    .insert([item])
    .select()
    .single();

  if (error) {
    console.error(`Erro ao inserir em ${table}:`, error);
    throw error;
  }
  return data;
};

export const updateItem = async (table, item) => {
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
  return data;
};

export const deleteItem = async (table, id) => {
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