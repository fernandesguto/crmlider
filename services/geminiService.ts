
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
// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
export const generatePropertyDescription = async (title: string, type: PropertyType, features: string[], area: number, bedrooms: number): Promise<string> => {
  // Always use process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Especialista imobiliário. Descrição profissional para: ${title}, ${type}, ${area}m², ${bedrooms} quartos. Destaques: ${features.join(', ')}. Sem markdown.`;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
    return (response.text || "").replace(/[*#]/g, '').trim();
  } catch (error) { return "Erro ao conectar com a IA."; }
};

export interface MarketingStrategyResult {
    texts: { tone: string; content: string }[];
    strategies: string[];
    targetAudience: string[];
    whatsappTips: string[];
}

// Create a new GoogleGenAI instance right before making an API call.
export const generateMarketingStrategy = async (property: Property): Promise<MarketingStrategyResult | null> => {
    // Always use process.env.API_KEY directly
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const priceFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(property.price);
    
    const prompt = `Atue como um Especialista em Copywriting Imobiliário de alto padrão. Sua tarefa é criar textos comerciais longos, detalhados e altamente persuasivos para o seguinte imóvel: 
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
    1. 'texts': Um array de objetos com 'tone' (Premium, Oportunidade, Emocional) e 'content' (o texto longo).
       O texto 'content' deve seguir este EXATO estilo e estrutura:
       - Título de impacto incluindo Bairro e Cidade/UF.
       - Espaçamento entre parágrafos para leitura leve.
       - Uma narrativa que conecte o imóvel ao estilo de vida e conforto.
       - Uma lista clara e formatada das características técnicas (m², dormitórios, banheiros).
       - Destaque para a área externa e benefícios da localização.
       - Valor de venda ou locação bem destacado com o emoji 💰.
       - Fechamento com chamada para ação forte usando o emoji 📞.

    2. 'strategies': Array com 4 estratégias de divulgação.
    3. 'targetAudience': Array com 3 perfis de público-alvo.
    4. 'whatsappTips': Array com 4 dicas comerciais para converter no WhatsApp.

    Retorne apenas o JSON puro, sem markdown ou textos explicativos fora do JSON.`;

    try {
        // Upgrade to gemini-3-pro-preview for complex text task
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
                        whatsappTips: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["texts", "strategies", "targetAudience", "whatsappTips"]
                }
            }
        });
        return parseGenerativeJson(response.text) as MarketingStrategyResult;
    } catch (error) { 
        console.error("Erro generateMarketingStrategy:", error);
        return null; 
    }
};

// Create a new GoogleGenAI instance right before making an API call.
export const askRealEstateAgent = async (question: string, leads: Lead[] = [], properties: Property[] = []): Promise<string> => {
    // Always use process.env.API_KEY directly
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Consultor imobiliário. Pergunta: "${question}". Dados: ${properties.length} imóveis, ${leads.length} leads. Sem markdown.`;
    try {
        // Upgrade to gemini-3-pro-preview for advanced reasoning
        const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt });
        return (response.text || "").replace(/\*/g, '');
    } catch (error) { return "Erro no chat."; }
};

// Create a new GoogleGenAI instance right before making an API call.
export const findOpportunities = async (leads: Lead[], properties: Property[]): Promise<AiMatchOpportunity[]> => {
    // Always use process.env.API_KEY directly
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Prepara dados reduzidos para o prompt
    const simpleLeads = leads.slice(0, 40).map(l => ({ id: l.id, nome: l.name, obs: l.notes || '', interesses: l.interestedInPropertyIds || [] }));
    const simpleProps = properties.filter(p => p.status === 'Active').slice(0, 40).map(p => ({ id: p.id, t: p.title, p: p.price, b: p.neighborhood, q: p.bedrooms, tp: p.type }));

    const prompt = `IA Especialista em Vendas Imobiliárias. 
    Cruze estes LEADS com estes IMÓVEIS e encontre as melhores combinações de compra/locação.
    
    LEADS: ${JSON.stringify(simpleLeads)}
    IMÓVEIS: ${JSON.stringify(simpleProps)}

    Regras:
    1. Retorne um JSON Array de objetos: { "leadId": string, "propertyId": string, "matchScore": number(0-100), "reason": string(motivo curto), "suggestedAction": string }.
    2. Ignore imóveis que o lead já possui na lista de interesses.
    3. Seja preciso nos cruzamentos de perfil.`;

    try {
        // Upgrade to gemini-3-pro-preview for complex reasoning task
        const response = await ai.models.generateContent({ 
            model: 'gemini-3-pro-preview', 
            contents: prompt, 
            config: { responseMimeType: 'application/json' } 
        });
        const result = parseGenerativeJson(response.text);
        return Array.isArray(result) ? result : [];
    } catch (error) { 
        console.error("Erro findOpportunities:", error);
        return []; 
    }
};

// Create a new GoogleGenAI instance right before making an API call.
export const analyzeStaleLeads = async (leads: Lead[], properties?: Property[]): Promise<AiRecoveryOpportunity[]> => {
    // Always use process.env.API_KEY directly
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const simpleLeads = leads.filter(l => l.status !== LeadStatus.CLOSED).slice(0, 30).map(l => ({ id: l.id, n: l.name, s: l.status, d: l.createdAt }));

    const prompt = `Estrategista Comercial. Analise estes leads "parados" e sugira uma abordagem de reativação via WhatsApp.
    
    LEADS: ${JSON.stringify(simpleLeads)}

    Retorne um JSON Array: [{ "type": "lead", "id": string, "name": string, "daysInactive": number, "info": string, "analysis": string, "suggestion": string(mensagem de whatsapp) }]`;

    try {
        // Upgrade to gemini-3-pro-preview for strategic analysis
        const response = await ai.models.generateContent({ 
            model: 'gemini-3-pro-preview', 
            contents: prompt, 
            config: { responseMimeType: 'application/json' } 
        });
        const result = parseGenerativeJson(response.text);
        return Array.isArray(result) ? result : [];
    } catch (error) { 
        console.error("Erro analyzeStaleLeads:", error);
        return []; 
    }
};
