import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

let geminiClient: GoogleGenerativeAI | null = null;

export function canUseGemini() {
  return Boolean(API_KEY);
}

export function getGeminiClient() {
  if (!canUseGemini()) {
    throw new Error(
      "Missing GEMINI_API_KEY. Add it to your environment configuration."
    );
  }

  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(API_KEY!);
  }

  return geminiClient;
}

export async function runGeminiPrompt(prompt: string, model = "gemini-2.5-flash") {
  const client = getGeminiClient();
  const generativeModel = client.getGenerativeModel({
    model,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 800,
    },
  });

  const result = await generativeModel.generateContent(prompt);
  const response = result.response;
  return response.text();
}

