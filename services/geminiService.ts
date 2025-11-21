import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const getChefCommentary = async (won: boolean, score: number, causeOfDeath?: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "The chef is too busy to comment (Check API Key).";

  const prompt = won
    ? `You are a very demanding, perfectionist head chef like Gordon Ramsay. The player just completed the level "The Special Order" and retrieved the Perfect Taco with a score of ${score}. Give them a grudging compliment mixed with a critique about their plating or timing. Keep it under 20 words.`
    : `You are a very demanding, perfectionist head chef like Gordon Ramsay. The player failed to get the taco in "The Special Order" level. Cause of failure: ${causeOfDeath || "Clumsiness"}. Roast them severely but cleanly. Keep it under 20 words.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || (won ? "Not bad, for a dishwasher." : "Get out of my kitchen!");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The Chef is silently judging you. (Check API Key)";
  }
};