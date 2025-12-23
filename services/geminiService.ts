
import { GoogleGenAI, Type } from "@google/genai";
import { PropertyType, Property, Lead, AiMatchOpportunity, AiRecoveryOpportunity, LeadStatus } from "../types";

// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
export const isAiConfigured = (): boolean => !!process.env.API_KEY;

export const getDebugInfo = () => {
    const key = process.env.API_KEY || '';
    return { 
        viteEnv: false, 
        processEnv: true, 
        keyLength: key.length, 
        hasKey: key.length > 0 
    };
};

const parseGenerativeJson = (text: string | undefined): any => {
    if (!text) return null;
    let jsonStr = text.trim().replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    try { return JSON.parse(jsonStr); } catch (e) { return null; }
};

// Create a new GoogleGenAI instance right before making an API call.
export const generatePropertyDescription = async (title: string, type: PropertyType, features: string[], area: number, bedrooms: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Especialista imobiliário. Descrição profissional para: ${title}, ${type}, ${area}m², ${bedrooms} quartos. Destaques: ${features.join(', ')}. Sem markdown.`;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return (response.text || "").replace(/[*#]/g, '').trim();
  } catch (error) { return "Erro ao conectar com a IA."; }
};

export interface InstagramPost {
    headline: string;
    body: string;
    visualSuggestion: string;
}

export interface MarketingStrategyResult {
    texts: { tone: string; content: string }[];
    strategies: string[];
    targetAudience: string[];
    whatsappTips: string[];
    instagramPosts: InstagramPost[];
}

// Create a new GoogleGenAI instance right before making an API call.
export const generateMarketingStrategy = async (property: Property): Promise<MarketingStrategyResult | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const priceFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.price);
    
    const prompt = `Atue como um Especialista em Marketing Imobiliário de alto nível. Sua tarefa é criar uma estratégia completa para o seguinte imóvel: 
    - Título: ${property.title}
    - Tipo: ${property.type}
    - Valor: ${priceFormatted}
    - Localização: Bairro ${property.neighborhood}, ${property.city}/${property.state}
    - Área: ${property.area}m²
    - Quartos: ${property.bedrooms}
    - Banheiros: ${property.bathrooms}
    - Diferenciais: ${property.features?.join(', ') || 'Nenhum informado'}
    - Descrição Original: ${property.description}

    Gere um JSON com as seguintes chaves:
    1. 'texts': Um array de objetos com 'tone' (Premium, Oportunidade, Emocional) e 'content' (texto persuasivo longo).
    2. 'strategies': Array com 4 estratégias de divulgação.
    3. 'targetAudience': Array com 3 perfis de público-alvo.
    4. 'whatsappTips': Array com 4 dicas comerciais para converter no WhatsApp.
    5. 'instagramPosts': Array com exatamente 3 objetos { 'headline', 'body', 'visualSuggestion' } específicos para ANÚNCIOS PAGOS (Instagram Ads).
       Cada post deve ter uma pegada comercial diferente:
       - Post 1: Foco em Estilo de Vida e Aspiração.
       - Post 2: Foco em Oportunidade Financeira e Custo-Benefício.
       - Post 3: Foco em Detalhes de Luxo/Exclusividade e Senso de Urgência.

    Retorne apenas o JSON puro, sem markdown ou textos explicativos fora do JSON.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        texts: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT, 
                                properties: { 
                                    tone: { type: Type.STRING }, 
                                    content: { type: Type.STRING } 
                                }, 
                                required: ["tone", "content"] 
                            } 
                        },
                        strategies: { type: Type.ARRAY, items: { type: Type.STRING } },
                        targetAudience: { type: Type.ARRAY, items: { type: Type.STRING } },
                        whatsappTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                        instagramPosts: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    headline: { type: Type.STRING },
                                    body: { type: Type.STRING },
                                    visualSuggestion: { type: Type.STRING }
                                },
                                required: ["headline", "body", "visualSuggestion"]
                            }
                        }
                    },
                    required: ["texts", "strategies", "targetAudience", "whatsappTips", "instagramPosts"]
                }
            }
        });
        return parseGenerativeJson(response.text) as MarketingStrategyResult;
    } catch (error) { 
        console.error("Erro generateMarketingStrategy:", error);
        return null; 
    }
};

export const askRealEstateAgent = async (question: string, leads: Lead[] = [], properties: Property[] = []): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Consultor imobiliário. Pergunta: "${question}". Dados: ${properties.length} imóveis, ${leads.length} leads. Sem markdown.`;
    try {
        const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
        return (response.text || "").replace(/\*/g, '');
    } catch (error) { return "Erro no chat."; }
};

export const findOpportunities = async (leads: Lead[], properties: Property[]): Promise<AiMatchOpportunity[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Mapeamento rico: Incluindo feedbacks específicos de cada imóvel que o lead já viu
    const simpleLeads = leads.slice(0, 40).map(l => ({ 
        id: l.id, 
        nome: l.name, 
        obs_gerais: l.notes || '', 
        interesses: (l.interests || []).map(i => {
            const prop = properties.find(p => p.id === i.propertyId);
            return {
                propertyId: i.propertyId,
                imovel_titulo: prop?.title || 'Desconhecido',
                feedback_cliente: i.notes || 'Sem observação específica'
            };
        })
    }));

    const simpleProps = properties.filter(p => p.status === 'Active').slice(0, 40).map(p => ({ 
        id: p.id, 
        t: p.title, 
        p: p.price, 
        b: p.neighborhood, 
        q: p.bedrooms, 
        tp: p.type,
        area: p.area,
        caracteristicas: p.features
    }));

    const prompt = `IA Especialista em Vendas Imobiliárias. Sua missão é identificar OPORTUNIDADES DE NEGÓCIO entre LEADS e IMÓVEIS.

    REGRAS DE OURO PARA SUA ANÁLISE:
    1. FEEDBACKS POSITIVOS: Se nos 'interesses' de um lead houver um feedback positivo (ex: "gostou muito", "achou legal", "interessou"), considere este imóvel como uma OPORTUNIDADE DE FECHAMENTO (Match Score > 90). Sua sugestão deve ser "Reforçar proposta e fechar negócio".
    2. FEEDBACKS NEGATIVOS: Se o feedback for negativo (ex: "quarto pequeno", "localização ruim"), NÃO sugira este imóvel e também NÃO sugira imóveis que tenham o mesmo problema.
    3. NOVOS MATCHES: Para imóveis que o lead ainda NÃO tem na lista de interesses, faça o cruzamento baseado no perfil e feedbacks anteriores.
    
    Retorne um JSON Array de objetos: { "leadId", "propertyId", "matchScore", "reason", "suggestedAction" }.
    O campo 'reason' deve ser muito específico: "O cliente elogiou a varanda deste imóvel nas notas anteriores" ou "Baseado na preferência por áreas amplas, este imóvel é ideal".`;

    try {
        const response = await ai.models.generateContent({ 
            model: 'gemini-3-pro-preview', 
            contents: `DADOS LEADS: ${JSON.stringify(simpleLeads)} \n\n DADOS IMÓVEIS: ${JSON.stringify(simpleProps)} \n\n ${prompt}`, 
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
                        },
                        required: ["leadId", "propertyId", "matchScore", "reason", "suggestedAction"]
                    }
                }
            } 
        });
        const result = parseGenerativeJson(response.text);
        return Array.isArray(result) ? result : [];
    } catch (error) { 
        console.error("Erro findOpportunities:", error);
        return []; 
    }
};

export const analyzeStaleLeads = async (leads: Lead[], properties?: Property[]): Promise<AiRecoveryOpportunity[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analise leads inativos. JSON Array: [{ "type", "id", "name", "daysInactive", "info", "analysis", "suggestion" }]`;
    try {
        const response = await ai.models.generateContent({ 
            model: 'gemini-3-pro-preview', 
            contents: prompt, 
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING },
                            id: { type: Type.STRING },
                            name: { type: Type.STRING },
                            daysInactive: { type: Type.NUMBER },
                            info: { type: Type.STRING },
                            analysis: { type: Type.STRING },
                            suggestion: { type: Type.STRING }
                        },
                        required: ["type", "id", "name", "daysInactive", "info", "analysis", "suggestion"]
                    }
                }
            } 
        });
        const result = parseGenerativeJson(response.text);
        return Array.isArray(result) ? result : [];
    } catch (error) { return []; }
};
