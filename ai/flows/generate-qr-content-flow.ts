'use server';
/**
 * @fileOverview An AI flow to generate QR code content from user intent.
 *
 * - generateQrContent - A function that handles the QR content generation process.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const PROMPT_TEMPLATE = `You are a QR code content generation expert. Based on the user's intent, generate the raw text that should be encoded into a QR code.
- For a URL, return the full URL (e.g., "https://www.google.com").
- For a Wi-Fi network, return the text in the format: "WIFI:T:WPA;S:NETWORK_NAME;P:PASSWORD;;"
- For an email, return a mailto link (e.g., "mailto:test@example.com?subject=Hello&body=Message").
- For a contact card (vCard), return the text in vCard format (e.g., "BEGIN:VCARD\\nVERSION:3.0\\nN:Gump;Forrest\\nFN:Forrest Gump\\nORG:Bubba Gump Shrimp Co.\\nTITLE:Shrimp Man\\nTEL;TYPE=WORK,VOICE:(111) 555-1212\\nADR;TYPE=WORK:;;100 W. Center;Baytown;LA;30314;United States of America\\nEMAIL;TYPE=PREF,INTERNET:forrestgump@example.com\\nEND:VCARD").
- For a phone number, return a tel link (e.g., "tel:+1234567890").
- For plain text, just return the text.

Only return the raw, final content for the QR code. Do not add any explanation, markdown, or formatting around it.

User Intent: "{INTENT}"`;

/**
 * Takes a user's natural language intent and returns a string
 * formatted for a QR code.
 * @param intent The user's desired content for the QR code.
 * @param apiKey The user's Gemini API key.
 * @returns A promise that resolves to the formatted QR code content string.
 */
export async function generateQrContent(
  intent: string,
  apiKey: string
): Promise<string> {
  // Dynamically configure Genkit with the provided API key for this request
  const ai = genkit({
    plugins: [googleAI({ apiKey })],
    logLevel: 'silent',
    enableTracing: false,
  });

  const llmResponse = await ai.generate({
    prompt: PROMPT_TEMPLATE.replace('{INTENT}', intent),
    model: 'gemini-1.5-flash',
    config: {
      temperature: 0.1,
    },
  });

  return llmResponse.text;
}
