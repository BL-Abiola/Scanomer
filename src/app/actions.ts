'use server';

import { analyzeQrContent } from '@/lib/qr-analyzer';
import type { AnalysisResult } from '@/lib/types';
import { generateQrContent } from '@/ai/flows/generate-qr-flow';

export async function analyzeAction(
  qrContent: string
): Promise<AnalysisResult | null> {
  if (!qrContent) {
    return null;
  }
  try {
    const result = analyzeQrContent(qrContent);
    return result;
  } catch (error) {
    console.error('Error in analyzeAction:', error);
    // In a real app, you might want to log this error to a monitoring service
    return null;
  }
}

export async function generateQrAction(
  prompt: string
): Promise<string | null> {
  if (!prompt) {
    return null;
  }
  try {
    // The API key is set as an environment variable on the server process
    // when the user saves it in the settings. For this action, we rely on it being available.
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('API Key not configured on the server.');
    }
    const result = await generateQrContent(prompt);
    return result;
  } catch (error) {
    console.error('Error in generateQrAction:', error);
    return null;
  }
}

    