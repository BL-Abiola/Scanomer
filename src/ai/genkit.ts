import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// We are intentionally not passing an API key here.
// The key is now managed on the client-side and passed through an environment variable
// during the action call. This is a placeholder for server-side-only initialization.
// The actual key is read from `process.env.GOOGLE_API_KEY` in the action.
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.5-flash',
});

    