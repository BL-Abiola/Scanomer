import { z } from 'zod';

export type QrType =
  | 'Website'
  | 'Payment'
  | 'Wi-Fi'
  | 'Contact'
  | 'Email'
  | 'Phone'
  | 'App Download'
  | 'File'
  | 'Unknown';

export type Signal = 'EMERALD' | 'INDIGO' | 'AMBER' | 'AMETHYST' | 'CRIMSON';

export type AnalysisResult = {
  type: QrType;
  signal: Signal;
  description: string;
  action: string;
  awareness: string;
  rootDomain?: string;
  hiddenVariables?: string[];
  qrContent: string;
};

export const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The user prompt for image generation.'),
  apiKey: z.string().describe('The Google AI API key.'),
});

export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;