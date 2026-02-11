'use server';

import { analyzeQrContent } from '@/lib/qr-analyzer';
import { generateImage } from '@/ai/flows/image-generator';
import type { AnalysisResult, GenerateImageInput } from '@/lib/types';

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
  input: GenerateImageInput
): Promise<string> {
  try {
    const imageUrl = await generateImage(input);
    return imageUrl;
  } catch (error: any) {
    console.error('Error in generateImageAction:', error);
    throw new Error(error.message || 'Failed to generate image.');
  }
}
