'use server';
/**
 * @fileOverview An AI flow to generate QR code content from a natural language prompt.
 *
 * - generateQrContent - A function that handles the QR code content generation process.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export async function generateQrContent(
  prompt: string,
  apiKey: string
): Promise<string> {
  // A temporary AI instance is created for each request using the provided API key.
  const ai = genkit({
    plugins: [googleAI({ apiKey })],
  });

  const { text } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: `You are an expert QR code content formatter. Your task is to convert a user's prompt into the correct string format for a QR code.

Supported formats:
- Website URL: (e.g., "https://example.com")
- Wi-Fi: "WIFI:T:<authentication_type>;S:<ssid>;P:<password>;;" (Default to WPA for authentication if not specified)
- Contact (vCard): "BEGIN:VCARD\\nVERSION:3.0\\nN:<LastName>;<FirstName>\\nFN:<FirstName> <LastName>\\nTEL:<PhoneNumber>\\nEMAIL:<Email>\\nEND:VCARD"
- Email: "mailto:<email_address>?subject=<subject>&body=<body>"
- Phone: "tel:<phone_number>"
- SMS: "smsto:<phone_number>:<message>"
- Plain Text: Any string that doesn't match the above.

Instructions:
1.  Analyze the user's prompt: ${prompt}.
2.  If the prompt is already a valid URL, email address, phone number, or simple text, return it exactly as is.
3.  If the prompt is a natural language request (e.g., "wifi for my network 'MyCafe' with password 'secret'"), convert it to the corresponding technical format.
4.  For vCards, extract as much information as possible (Name, Phone, Email).
5.  Your response MUST ONLY be the final formatted string for the QR code. Do not include any explanations, backticks, markdown, or any text other than the content to be encoded.

Examples:
- Prompt: "https://google.com" -> Output: "https://google.com"
- Prompt: "My wifi is MyNet and pass is 123" -> Output: "WIFI:T:WPA;S:MyNet;P:123;;"
- Prompt: "a vcard for John Smith, john@smith.com, 555-1234" -> Output: "BEGIN:VCARD\\nVERSION:3.0\\nN:Smith;John\\nFN:John Smith\\nTEL:555-1234\\nEMAIL:john@smith.com\\nEND:VCARD"
- Prompt: "Just some text" -> Output: "Just some text"
`,
  });

  return text || prompt;
}
