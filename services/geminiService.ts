
import { GoogleGenAI, Type } from "@google/genai";
import { PropertyType, Property, Lead, AiMatchOpportunity, AiStaleLeadOpportunity, LeadStatus } from "../types";

// Função robusta para pegar a chave em qualquer ambiente (Vite, Vercel, Local)
const getApiKey = () => {
  let key = '';
  
  // Debug no Console (F12)
  console.log("[ImobERP Debug] Tentando carregar API Key...");

  // 1. Tenta o padrão oficial do Vite (Produção/Vercel)
  // @ts-ignore
  if (import.meta.env && import.meta.env.VITE_API_KEY) {
    console.log("[ImobERP Debug] VITE_API_KEY encontrada.");
    // @ts-ignore
    key = import.meta.env.VITE_API_KEY;
  } else {
    console.log("[ImobERP Debug] VITE_API_KEY NÃO encontrada em import.meta.env");
  }
  
  // 2. Tenta o padrão injetado via define (Local/Process) se a anterior falhar
  if (!key) {
      try {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            console.log("[ImobERP Debug] process.env.API_KEY encontrada.");
            // @ts-ignore
            key = process.env.API_KEY;
        }
      } catch (e) {
        // ignore
      }
  }

  if (!key) {
      console.error("[ImobERP Debug] CRÍTICO: Nenhuma chave de API encontrada. Verifique as variáveis de ambiente na Vercel.");
  }

  return key;
};

const apiKey = getApiKey();

const getAiClient = () => {
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const isAiConfigured = (): boolean => {
  return !!getApiKey();
};

export const getDebugInfo = () => {
    const info = {
        viteEnv: false,
        processEnv: false,
        keyLength: 0,
        hasKey: false
    };

    try {
        // @ts-ignore
        if (import.meta.env && import.meta.env.VITE_API_KEY) {
            info.viteEnv = true;
            // @ts-ignore
            info.keyLength = import.meta.env.VITE_API_KEY.length;
        }
    } catch(e) {}

    try {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
            info.processEnv = true;
            // @ts-ignore
            if (info.keyLength === 0) info.keyLength = process.env.API_KEY.length;
        }
    } catch(e) {}

    info.hasKey = info.keyLength > 0;
    return info;
};

/**
 * Tenta fazer o parse de JSON vindo da IA.
 * Se falhar (truncado/unterminated), tenta recuperar os objetos válidos até o ponto de corte.
 */
const parseGenerativeJson = (text: string | undefined): any[] => {
    if (!text) return [];
    
    // 1. Limpeza básica de Markdown
    let jsonStr = text.trim()
        .replace(/^```json\s*/, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '');

    // 2. Tentativa direta
    try {
        const parsed = JSON.parse(jsonStr);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.warn("JSON Parse Error (Full). Attempting salvage...", e);
        
        // 3. Estratégia de Recuperação: Achar o último fechamento de objeto válido '}'
        // Isso descarta o final da string que foi cortado (ex: '... "rea')
        const firstBracket = jsonStr.indexOf('[');
        if (firstBracket === -1) return [];

        const lastBrace = jsonStr.lastIndexOf('}');
        if (lastBrace === -1 || lastBrace < firstBracket) return [];

        // Reconstrói o array fechando-o manualmente
        const salvaged = jsonStr.substring(firstBracket, lastBrace + 1) + ']';
        
        try {
            const parsedSalvaged = JSON.parse(salvaged);
            return Array.isArray(parsedSalvaged) ? parsedSalvaged : [];
        } catch (e2) {
            console.error("Critical: Failed to salvage JSON.", e2);
            return [];
        }
    }
};

export const generatePropertyDescription = async (
  title: string,
  type: PropertyType,
  features: string[],
  area: number,
  bedrooms: number
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) {
    console.warn("API Key is missing. Returning mock description.");
    return "Descrição automática indisponível. Por favor, configure a chave de API.";
  }

  const prompt = `
    Atue como um especialista em marketing imobiliário. Escreva uma descrição atraente e profissional para um imóvel com as seguintes características:
    - Título: ${title}
    - Tipo: ${type}
    - Área: ${area}m²
    - Quartos: ${bedrooms}
    - Destaques: ${features.join(', ')}

    Regras Importantes:
    1. A descrição deve ter aproximadamente 3 parágrafos curtos.
    2. Enfatize o conforto e a oportunidade.
    3. NÃO utilize formatação Markdown (negrito, itálico, cabeçalhos).
    4. NÃO utilize os caracteres '#' ou '*'. Escreva apenas texto corrido.
    5. Responda em Português do Brasil.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    let text = response.text || "Não foi possível gerar a descrição.";
    text = text.replace(/[*#]/g, '').trim();
    return text;
  } catch (error) {
    console.error("Error generating description:", error);
    return "Erro ao conectar com a IA para gerar a descrição.";
  }
};

export interface MarketingCopyResult {
    tone: string;
    text: string;
    emojis: string;
}

export const generateMarketingCopy = async (property: Property): Promise<MarketingCopyResult[]> => {
    const ai = getAiClient();
    if (!ai) return [];

    const safeFeatures = property.features ? property.features.join(', ') : 'Nenhum';
    
    const prompt = `
        Atue como um Copywriter Imobiliário.
        Crie 3 variações de textos curtos para Instagram/WhatsApp.

        Imóvel: ${property.title}
        Detalhes: ${property.bedrooms} quartos, ${property.area}m², R$ ${property.price}.
        Bairro: ${property.neighborhood}.
        Extras: ${safeFeatures}.

        Retorne APENAS um JSON Array puro. Sem Markdown. Sem código.
        Estrutura: [{"tone": "...", "text": "...", "emojis": "..."}]
        
        Tons: Venda, Oportunidade, Luxo.
        Textos curtos (max 250 caracteres cada).
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                maxOutputTokens: 2500 // Limite seguro
            }
        });

        const results = parseGenerativeJson(response.text);

        // Regex para limpar emojis extras se necessário
        const removeEmojis = (str: string) => str.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();

        return results.map((item: any) => ({
            tone: removeEmojis(item.tone || 'Tom Padrão').toUpperCase(),
            text: item.text || 'Texto gerado.',
            emojis: item.emojis || '📝'
        }));

    } catch (error) {
        console.error("Erro ao gerar marketing:", error);
        return [
            { tone: "ERRO DE GERAÇÃO", text: "Não foi possível gerar os textos automaticamente neste momento. Tente novamente.", emojis: "⚠️" }
        ];
    }
};

export const askRealEstateAgent = async (
    question: string, 
    leads: Lead[] = [], 
    properties: Property[] = []
): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Erro: Chave de API não configurada.";

    // Otimização: Enviar apenas dados essenciais para economizar tokens
    const simpleLeads = leads.slice(0, 50).map(l => ({
        nome: l.name,
        tipo: l.type === 'Buyer' ? 'Comprador' : 'Proprietário',
        interesses: l.notes || 'Não informado',
        status: l.status
    }));

    const simpleProperties = properties.filter(p => p.status === 'Active').slice(0, 50).map(p => ({
        titulo: p.title,
        tipo: p.type,
        bairro: p.neighborhood,
        preco: p.price,
        quartos: p.bedrooms
    }));

    const prompt = `
        Você é um consultor jurídico, comercial e estrategista sênior de uma imobiliária (CRECI/OAB).
        
        --- DADOS DO SISTEMA (Amostra) ---
        IMÓVEIS DISPONÍVEIS: ${JSON.stringify(simpleProperties)}
        CLIENTES (LEADS): ${JSON.stringify(simpleLeads)}
        ---------------------------------

        Sua missão é responder à dúvida do corretor.
        Seja direto, profissional e use tópicos quando necessário.
        Responda sempre em Português do Brasil.

        Pergunta do Corretor: "${question}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text || "Não consegui encontrar uma resposta para sua dúvida no momento.";
    } catch (error) {
        console.error("Erro no Chat Imobiliário:", error);
        return "Desculpe, o serviço de consultoria está indisponível no momento. Verifique sua chave de API.";
    }
};

export const findOpportunities = async (
    leads: Lead[],
    properties: Property[]
): Promise<AiMatchOpportunity[]> => {
    const ai = getAiClient();
    if (!ai) return [];

    // Otimização de Payload: Enviar apenas dados essenciais
    // Limita para evitar payload gigante que causa erro de string não terminada
    const activeProperties = properties.filter(p => p.status === 'Active').slice(0, 100).map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        neighborhood: p.neighborhood,
        bedrooms: p.bedrooms,
        type: p.type
    }));

    const leadsProfile = leads.slice(0, 50).map(l => {
        return {
            id: l.id,
            name: l.name,
            notes: l.notes,
            // Envia apenas IDs de interesse para economizar espaço
            interests: l.interestedInPropertyIds
        };
    });

    const prompt = `
        Você é uma IA especialista em vendas imobiliárias.
        Cruze os dados de LEADS com IMÓVEIS e encontre oportunidades.

        Regras:
        1. Analise o perfil dos leads.
        2. Encontre imóveis compatíveis (preço, local, tipo).
        3. Ignore imóveis que o lead JÁ demonstrou interesse.
        4. Retorne APENAS as 15 melhores oportunidades (Top 15).
        5. IMPORTANTE: NÃO repita os dados de entrada na resposta. Retorne APENAS o JSON de saída.

        Dados LEADS: ${JSON.stringify(leadsProfile)}
        Dados IMÓVEIS: ${JSON.stringify(activeProperties)}

        Responda EXCLUSIVAMENTE com um JSON Array no formato:
        [
            {
                "leadId": "id do lead",
                "propertyId": "id do imóvel",
                "matchScore": number (0-100),
                "reason": "Motivo curto (1 frase)",
                "suggestedAction": "Ação sugerida"
            }
        ]
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                maxOutputTokens: 4000 // Aumentado para comportar lista de 15 itens
            }
        });

        return parseGenerativeJson(response.text) as AiMatchOpportunity[];

    } catch (error) {
        console.error("Erro na IA de Matchmaking:", error);
        return [];
    }
};

export const analyzeStaleLeads = async (
    leads: Lead[]
): Promise<AiStaleLeadOpportunity[]> => {
    const ai = getAiClient();
    if (!ai) return [];

    const now = new Date();
    const staleThresholdDays = 10;

    const staleLeads = leads
        .filter(l => l.status !== LeadStatus.CLOSED && l.status !== LeadStatus.LOST)
        .map(l => {
            let lastInteraction = new Date(l.createdAt);
            if (l.interests && l.interests.length > 0) {
                const dates = l.interests.map(i => new Date(i.updatedAt).getTime());
                const maxDate = Math.max(...dates);
                if (!isNaN(maxDate)) lastInteraction = new Date(maxDate);
            }

            const diffTime = Math.abs(now.getTime() - lastInteraction.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            return {
                id: l.id,
                name: l.name,
                status: l.status,
                daysInactive: diffDays,
                notes: l.notes || "Sem observações."
            };
        })
        .filter(l => l.daysInactive >= staleThresholdDays)
        .slice(0, 20); // Analisa no máximo 20 leads parados por vez para não estourar

    if (staleLeads.length === 0) return [];

    const prompt = `
        Você é um gerente comercial. Analise estes leads "parados" e sugira reativação.

        Lista: ${JSON.stringify(staleLeads)}

        Para cada lead, gere uma mensagem de WhatsApp curta e cordial para retomar contato.
        
        Responda EXCLUSIVAMENTE com um JSON Array:
        [
            {
                "leadId": "id do lead",
                "daysInactive": number,
                "currentStatus": "status",
                "analysis": "Motivo provável (1 frase)",
                "reactivationMessage": "Mensagem curta para WhatsApp"
            }
        ]
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                maxOutputTokens: 4000
            }
        });

        return parseGenerativeJson(response.text) as AiStaleLeadOpportunity[];

    } catch (error) {
        console.error("Erro na IA de Stale Leads:", error);
        return [];
    }
};
