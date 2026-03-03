
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Initialize Genkit with the Google AI plugin.
// It will automatically look for the GEMINI_API_KEY environment variable.
export const ai = genkit({
  plugins: [googleAI()],
  logLevel: 'silent',
  enableTracing: false,
});
