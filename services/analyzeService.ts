
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, RiskLevel } from "../types";

// Helper to get a fresh instance with the current process.env.API_KEY
// SDK guidelines require creating a new instance before call to capture key updates from settings.
const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzePayload(content: string): Promise<AnalysisResult> {
  const prompt = `
    Analyze this QR code content for security risks: "${content}"
    
    SECURITY PROTOCOL:
    1. Identify the type of content (URL, WIFI, TEXT, etc.).
    2. If it's a URL, perform a multi-vector risk assessment:
       - Check for phishing or deceptive domain names (look-alike characters).
       - Assess for high-risk categories including pornography, gambling, or malware distribution.
       - Check for aggressive tracking parameters or unusual redirect patterns.
    3. Categorize the risk level.

    Return JSON:
    {
      "type": "URL | TEXT | WIFI | VCARD | CRYPTO",
      "score": 0-100,
      "level": "GREEN | YELLOW | ORANGE | RED",
      "flags": ["list of specific threats found like 'Phishing', 'Adult Content', 'Malware Target'"],
      "redirectChain": [],
      "explanation": "Brief, professional safety summary.",
      "previewDescription": "A clear description of what the user will see if they proceed."
    }
  `;

  try {
    const ai = getAi();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            score: { type: Type.NUMBER },
            level: { type: Type.STRING },
            flags: { type: Type.ARRAY, items: { type: Type.STRING } },
            redirectChain: { type: Type.ARRAY, items: { type: Type.STRING } },
            explanation: { type: Type.STRING },
            previewDescription: { type: Type.STRING }
          },
          required: ["type", "score", "level", "flags", "explanation"]
        }
      }
    });

    const resultText = response.text?.trim();
    if (!resultText) throw new Error("AI engine returned an empty result.");

    let data;
    try {
      data = JSON.parse(resultText);
    } catch (parseError) {
      throw new Error("AI output validation failed: Invalid JSON format.");
    }

    // Explicit field validation for runtime safety
    const requiredFields = ["type", "score", "level", "flags", "explanation"];
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null) {
        throw new Error(`AI payload is missing critical field: ${field}`);
      }
    }

    return {
      ...data,
      raw: content,
      type: (['URL', 'WIFI', 'VCARD', 'TEXT', 'CRYPTO', 'OTP'].includes(data.type)) ? data.type : 'TEXT',
      redirectChain: Array.isArray(data.redirectChain) ? data.redirectChain : [content],
      level: Object.values(RiskLevel).includes(data.level) ? (data.level as RiskLevel) : RiskLevel.YELLOW
    };
  } catch (error: any) {
    console.error("High-Intensity AI Analysis Disrupted:", error);
    
    // Check if the error is related to key selection or project availability
    const isAuthError = error?.message?.includes("Requested entity was not found.") || error?.message?.includes("API key");
    
    const explanation = isAuthError 
      ? "AI Analysis Disrupted: The selected API key is invalid or lacks a paid project connection."
      : "Deep inspection error: The AI engine encountered a data-validation failure.";

    const errorMessage = isAuthError
        ? "Please visit Settings to link a valid API key with billing enabled."
        : "We have reverted to local security heuristics. Please treat this payload as potentially hazardous.";

    return {
      raw: content,
      type: 'TEXT',
      score: 0,
      level: RiskLevel.ORANGE, // Escalate to Orange on error for safety
      flags: ["AI_DISRUPTION", isAuthError ? "AUTH_FAILURE" : "ENGINE_VALIDATION_ERROR"],
      redirectChain: [content],
      explanation: explanation,
      previewDescription: "Security preview generation bypassed due to technical disruption.",
      error: errorMessage
    };
  }
}
