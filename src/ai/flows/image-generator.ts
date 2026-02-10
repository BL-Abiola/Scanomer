'use server';
/**
 * @fileOverview A QR-code themed image generation AI flow.
 *
 * - generateImage - A function that handles the image generation process.
 * - GenerateImageInput - The input type for the generateImage function.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { ai } from '@/ai/genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The user prompt for image generation.'),
  apiKey: z.string().describe('The Google AI API key.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

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
