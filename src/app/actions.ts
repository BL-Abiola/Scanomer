'use server';

import { analyzeQrContent } from '@/lib/qr-analyzer';
import type { AnalysisResult } from '@/lib/types';
import { generateImage, type GenerateImageOutput } from '@/ai/flows/generate-image-flow';

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
  prompt: string
): Promise<GenerateImageOutput | null> {
  if (!prompt) {
    return null;
  }
  try {
    const result = await generateImage({ prompt });
    return result;
  } catch (error) {
    console.error('Error in generateImageAction:', error);
    return null;
  }
}
