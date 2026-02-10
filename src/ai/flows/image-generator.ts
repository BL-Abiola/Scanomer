'use server';
/**
 * @fileOverview A QR-code themed image generation AI flow.
 *
 * - generateImage - A function that handles the image generation process.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { GenerateImageInputSchema, type GenerateImageInput } from '@/lib/types';


export async function generateImage(input: GenerateImageInput): Promise<string> {
    return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    // Create a temporary, per-request Genkit instance with the user's API key.
    // This is more secure than holding a single global instance.
    const perRequestAi = genkit({
      plugins: [
        googleAI({
          apiKey: input.apiKey,
        }),
      ],
    });

    const { media } = await perRequestAi.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: `A QR code integrated into: ${input.prompt}`,
    });
    
    if (!media.url) {
        throw new Error('Image generation failed to return an image URL.');
    }

    return media.url;
  }
);