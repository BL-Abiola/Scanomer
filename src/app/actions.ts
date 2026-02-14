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
    const result = await generateQrContent(prompt);
    return result;
  } catch (error) {
    console.error('Error in generateQrAction:', error);
    return null;
  }
}
