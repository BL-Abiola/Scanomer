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
  prompt: string,
  apiKey: string
): Promise<string> {
  if (!prompt) {
    throw new Error('Prompt cannot be empty.');
  }
  if (!apiKey) {
    throw new Error('API Key is required. Please add it in the settings.');
  }

  try {
    const result = await generateQrContent(prompt, apiKey);
    if (!result) {
      throw new Error('AI returned an empty response.');
    }
    return result;
  } catch (e: any) {
    console.error('Upstream error in generateQrAction:', e.message);
    if (e.message?.includes('API key not valid')) {
      throw new Error(
        'Your Google AI API key is invalid. Please check it in settings.'
      );
    }
    throw new Error('The AI service failed to process your request.');
  }
}
