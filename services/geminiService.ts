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
    
    // Limpeza de segurança para remover qualquer markdown residual
    text = text.replace(/[*#]/g, '').trim();
    
    return text;
  } catch (error) {
    console.error("Error generating description:", error);
    return "Erro ao conectar com a IA para gerar a descrição.";
  }
};

export const askRealEstateAgent = async (question: string): Promise<string> => {
    const ai = getAiClient();
    if (!ai) return "Erro: Chave de API não configurada. Verifique se a variável VITE_API_KEY está definida na Vercel.";

    const prompt = `
        Você é um consultor jurídico, financeiro e comercial sênior do mercado imobiliário brasileiro (CRECI/OAB).
        Seu objetivo é auxiliar corretores de imóveis com dúvidas técnicas do dia a dia.

        O usuário fará uma pergunta sobre: 
        - Financiamento (SBPE, Minha Casa Minha Vida, Procotista, etc)
        - Documentação (ITBI, RGI, Escritura, Contratos)
        - Leis de Inquilinato (Lei 8.245)
        - Tendências de Mercado
        - Técnicas de Venda e Argumentação

        Regras de Resposta:
        1. Responda de forma direta, clara e profissional.
        2. Use tópicos (bullet points) para listas de documentos ou passos.
        3. Se for sobre financiamento, cite as regras gerais atuais dos principais bancos (Caixa, etc).
        4. Adicione um pequeno disclaimer legal quando necessário ("Sugere-se consultar um advogado para casos específicos").
        5. Formate a resposta para ser fácil de ler em uma tela.

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
        return "Desculpe, o serviço de consultoria está indisponível no momento.";
    }
};

export const findOpportunities = async (
    leads: Lead[],
    properties: Property[]
): Promise<AiMatchOpportunity[]> => {
    const ai = getAiClient();
    if (!ai) return [];

    // Filtra dados para não estourar o contexto e foca em leads ativos e imóveis ativos
    const activeProperties = properties.filter(p => p.status === 'Active').map(p => ({
        id: p.id,
        title: p.title,
        price: p.price,
        city: p.city,
        neighborhood: p.neighborhood,
        bedrooms: p.bedrooms,
        type: p.type,
        features: p.features
    }));

    // Prepara perfil dos leads baseado no histórico (imóveis que eles já gostaram)
    const leadsProfile = leads.map(l => {
        // Pega detalhes dos imóveis que o lead já demonstrou interesse
        const interestedProps = properties.filter(p => l.interestedInPropertyIds.includes(p.id));
        
        // Se o lead não tem histórico, passamos apenas as notas
        const history = interestedProps.map(p => `${p.type} em ${p.neighborhood} (${p.price})`).join(', ');

        return {
            id: l.id,
            name: l.name,
            notes: l.notes,
            historyOfInterest: history || "Sem histórico de imóveis, basear apenas em notas ou perfil geral de comprador."
        };
    });

    const prompt = `
        Você é uma IA especialista em vendas imobiliárias.
        Sua tarefa é cruzar os dados de LEADS com IMÓVEIS DISPONÍVEIS e encontrar oportunidades de negócio.

        Regras:
        1. Analise o histórico de interesses e notas de cada Lead.
        2. Encontre imóveis na lista de DISPONÍVEIS que combinem com esse perfil (preço similar, mesma região, características parecidas).
        3. Ignore imóveis que o lead JÁ demonstrou interesse (não sugira o óbvio).
        4. Retorne apenas as melhores oportunidades (Match Score > 70).
        5. Seja criativo: se o lead gosta de "Casa com Piscina", procure isso nos diferenciais.

        Dados dos LEADS:
        ${JSON.stringify(leadsProfile)}

        Dados dos IMÓVEIS DISPONÍVEIS:
        ${JSON.stringify(activeProperties)}

        Responda EXCLUSIVAMENTE com um JSON Array.
        Schema esperado:
        [
            {
                "leadId": "id do lead",
                "propertyId": "id do imóvel",
                "matchScore": number (0-100),
                "reason": "Explicação curta de 1 frase do porquê esse imóvel serve para este lead.",
                "suggestedAction": "Sugestão de abordagem (Ex: Enviar fotos da piscina via WhatsApp)"
            }
        ]
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            leadId: { type: Type.STRING },
                            propertyId: { type: Type.STRING },
                            matchScore: { type: Type.NUMBER },
                            reason: { type: Type.STRING },
                            suggestedAction: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        const jsonStr = response.text?.trim();
        if (!jsonStr) return [];
        return JSON.parse(jsonStr) as AiMatchOpportunity[];

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
    const staleThresholdDays = 10; // Considera parado se não houver atualização em 10 dias

    // CORREÇÃO: Cria novos objetos mapeados em vez de mutar os originais com (l as any)._daysInactive
    const staleLeads = leads
        .filter(l => l.status !== LeadStatus.CLOSED && l.status !== LeadStatus.LOST)
        .map(l => {
            // Tenta achar a data mais recente de interação nos interesses ou usa criação
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
        .filter(l => l.daysInactive >= staleThresholdDays);

    if (staleLeads.length === 0) return [];

    const prompt = `
        Você é um gerente comercial sênior em uma imobiliária.
        Sua tarefa é analisar uma lista de leads que estão "parados" (sem interação há muito tempo) e sugerir como reativá-los.

        Lista de Leads Parados:
        ${JSON.stringify(staleLeads)}

        Para cada lead, analise o perfil e o tempo parado.
        Gere uma mensagem de WhatsApp cordial, curta e personalizada para tentar retomar o contato.
        A mensagem deve parecer natural, como "Olá Fulano, vi que faz um tempo que não nos falamos...".

        Responda EXCLUSIVAMENTE com um JSON Array.
        Schema esperado:
        [
            {
                "leadId": "id do lead",
                "daysInactive": number (copiar do input),
                "currentStatus": "string (copiar do input)",
                "analysis": "Breve análise do motivo provável do silêncio (1 frase)",
                "reactivationMessage": "Texto da mensagem sugerida para WhatsApp"
            }
        ]
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            leadId: { type: Type.STRING },
                            daysInactive: { type: Type.NUMBER },
                            currentStatus: { type: Type.STRING },
                            analysis: { type: Type.STRING },
                            reactivationMessage: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        const jsonStr = response.text?.trim();
        if (!jsonStr) return [];
        return JSON.parse(jsonStr) as AiStaleLeadOpportunity[];

    } catch (error) {
        console.error("Erro na IA de Stale Leads:", error);
        return [];
    }
};
