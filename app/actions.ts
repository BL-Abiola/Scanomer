'use server';

import { analyzeQrContent } from '@/lib/qr-analyzer';
import type { AnalysisResult } from '@/lib/types';
import { generateQrContent } from '@/ai/flows/generate-qr-content-flow';
import { inspectContent } from '@/ai/flows/inspect-content-flow';

export async function analyzeAction(
  qrContent: string,
  apiKey: string | null
): Promise<AnalysisResult | null> {
  if (!qrContent) {
    return null;
  }
  try {
    // 1. Perform heuristic analysis for basic type/action
    const result = analyzeQrContent(qrContent);

    // 2. If API Key is provided, perform deep AI security inspection
    if (apiKey) {
      const securityReport = await inspectContent(qrContent, apiKey);
      result.securityReport = securityReport;
      
      // Upgrade signal based on AI findings if AI is more conservative
      if (securityReport.level === 'RED') {
        result.signal = 'CRIMSON';
      } else if (securityReport.level === 'ORANGE' && result.signal === 'EMERALD') {
        result.signal = 'AMBER';
      }
    }

    return result;
  } catch (error) {
    console.error('Error in analyzeAction:', error);
    return null;
  }
}

export async function generateQrWithAiAction(
  intent: string,
  apiKey: string | null
): Promise<{ success: boolean; content?: string; error?: string }> {
  if (!intent) {
    return { success: false, error: 'Intent cannot be empty.' };
  }
  if (!apiKey) {
    return {
      success: false,
      error: 'A Gemini API key is required. Please add it in the settings.',
    };
  }

  try {
    const content = await generateQrContent(intent, apiKey);
    return { success: true, content };
  } catch (error: any) {
    console.error('Error in generateQrWithAiAction:', error);
    const errorMessage =
      'The AI service failed to process your request. This could be due to an invalid API key or a temporary network issue. Please check your key and try again.';
    return {
      success: false,
      error: errorMessage,
    };
  }
}
