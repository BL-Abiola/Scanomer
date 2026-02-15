
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, RiskLevel } from "../types";

// Create fresh instances to capture the most current API key from the environment
const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzePayload(content: string): Promise<AnalysisResult> {
  // Delegate to the primary service to ensure consistent validation logic
  const { analyzePayload: mainAnalyze } = await import("./analyzeService");
  return mainAnalyze(content);
}

export async function nlpToSchema(input: string): Promise<string> {
  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `CREATE ACTUAL DATA FOR: "${input}"`,
      config: {
        systemInstruction: `You are a Senior Data Synthesis Engine.
        Your job is to produce ACTUAL unique data based on user constraints.
        
        CRITICAL INSTRUCTION:
        - DO NOT repeat the user's instructions.
        - If they ask for "random prime numbers", you MUST use your knowledge to provide REAL prime numbers (e.g. 17, 31, 47, 61).
        - If they ask for "special characters in between", you MUST actually put the symbols between the numbers.
        - For WIFI: WIFI:S:[SSID];T:WPA;P:[GENERATED_CONTENT];;
        
        EXAMPLE:
        Input: "Generate a wifi pass with 4 primes and #, $, *, @ symbols"
        Output: WIFI:S:MyNetwork;T:WPA;P:13#29$43*59@;;
        
        Respond ONLY with the final string payload. No preamble.`,
        temperature: 0.9,
      }
    });

    const output = response.text?.trim().replace(/^`+|`+$/g, '');
    if (!output) throw new Error("AI generation produced an empty string.");
    return output;
  } catch (error: any) {
    console.error("AI Generation failed:", error);
    const isAuthError = error?.message?.includes("Requested entity was not found.");
    throw new Error(isAuthError ? "Auth failed: Update your API Key in Settings" : "AI was unable to generate valid content.");
  }
}
