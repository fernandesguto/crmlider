import { GoogleGenAI } from "@google/genai";
import { PropertyType } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize the client only if the key is present to avoid errors on load if missing
const getAiClient = () => {
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
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

    A descrição deve ter aproximadamente 3 parágrafos, enfatizando o conforto e a oportunidade. Responda em Português do Brasil.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Não foi possível gerar a descrição.";
  } catch (error) {
    console.error("Error generating description:", error);
    return "Erro ao conectar com a IA para gerar a descrição.";
  }
};
