'use server';

import { analyzeQrContent } from '@/lib/qr-analyzer';
import type { AnalysisResult } from '@/lib/types';
import { generateImage } from '@/ai/flows/image-generator';

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

export async function generateImageAction(
  prompt: string,
  apiKey: string
): Promise<string | null> {
  if (!prompt || !apiKey) {
    return null;
  }
  try {
    const result = await generateImage({ prompt, apiKey });
    return result;
  } catch (error: any) {
    console.error('Error in generateImageAction:', error);
    // Propagate the error message to the client
    throw new Error(error.message || 'An unknown error occurred during image generation.');
  }
}
