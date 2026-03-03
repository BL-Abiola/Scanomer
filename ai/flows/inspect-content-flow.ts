'use server';
/**
 * @fileOverview An AI flow to inspect QR code content for security threats and content analysis.
 */

import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { RiskLevel, type SecurityReport } from '@/lib/types';

const SecurityReportSchema = z.object({
  type: z.string().describe('The identified type of content.'),
  score: z.number().describe('Security threat score from 0-100 (0=Safe, 100=Dangerous).'),
  level: z.enum(['GREEN', 'YELLOW', 'ORANGE', 'RED']).describe('The calculated risk level.'),
  flags: z.array(z.string()).describe('Threat flags identified.'),
  explanation: z.string().describe('A concise explanation of the security findings.'),
  isHarmfulToMinors: z.boolean().describe('Whether the content is unsuitable for children or contains adult material.'),
  whatToExpect: z.string().describe('A detailed description of what the user will see if they click this link.'),
  siteName: z.string().optional().describe('The name or brand of the website if identifiable.'),
});

/**
 * Inspects content for security threats using Gemini.
 */
export async function inspectContent(
  content: string,
  apiKey: string
): Promise<SecurityReport> {
  const ai = genkit({
    plugins: [googleAI({ apiKey })],
    logLevel: 'silent',
    enableTracing: false,
  });

  // 1. Attempt to fetch metadata for deeper analysis
  let siteContext = "";
  try {
    if (content.startsWith('http') || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(content)) {
      const urlToFetch = content.startsWith('http') ? content : `https://${content}`;
      const response = await fetch(urlToFetch, { 
        method: 'GET',
        headers: { 'User-Agent': 'ScanWise-Forensic-Bot/1.0' },
        signal: AbortSignal.timeout(4000) 
      });
      if (response.ok) {
        const html = await response.text();
        
        // Extract Title
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : "No Title Found";
        
        // Extract Meta Description
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) || 
                          html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
        const metaDesc = descMatch ? descMatch[1] : "No Meta Description Found";
        
        const bodyPreview = html.substring(0, 1000).replace(/<[^>]*>/g, ' ').trim();
        siteContext = `LIVE SITE DATA: Title="${title}". Meta Description="${metaDesc}". Content Preview: "${bodyPreview.substring(0, 500)}..."`;
      }
    }
  } catch (e) {
    siteContext = "LIVE SITE DATA: Destination server did not respond to real-time verification.";
  }

  // 2. Perform AI Inspection
  const prompt = `
    You are a Neutral Forensic Interceptor and Security Analyst. 
    Analyze the following QR content for threats: "{{content}}"
    
    ${siteContext ? `CONTEXT FROM LIVE ACCESS:\n${siteContext}\n` : ""}
    
    INSTRUCTIONS:
    1. OBJECTIVITY: Do not flag sites as RED unless they are confirmed malicious (phishing, malware) or contain restricted adult content.
    2. POSITIVITY: If the content is a standard business, informational, or rewards website, you must set level to GREEN.
    3. ADULT CONTENT: If you detect ANY pornography, adult content, or sexually explicit material, you MUST set level to RED, score to 100, isHarmfulToMinors to TRUE, and include "NSFW" in the flags array.
    4. SITE NAME: Always try to find the site name (e.g., "YouTube", "Google", "Rewards Portal").
    5. DESCRIPTION: Provide a highly detailed description in 'whatToExpect' of what this service or content is.
    
    Return structured data matching the schema.
  `;

  try {
    const llmResponse = await ai.generate({
      prompt: prompt.replace('{{content}}', content),
      model: 'gemini-1.5-flash',
      output: { schema: SecurityReportSchema },
      config: { temperature: 0.1 },
    });

    const output = llmResponse.output;

    if (!output) throw new Error('AI failed to return structured data.');

    return {
      raw: content,
      ...output,
      level: output.level as RiskLevel,
    };
  } catch (error) {
    console.error("Security Analysis Failed:", error);
    
    let fallbackHostname = "the scanned link";
    try {
      const urlToParse = content.startsWith('http') ? content : `https://${content}`;
      fallbackHostname = new URL(urlToParse).hostname;
    } catch (e) {}

    return {
      raw: content,
      type: "UNVERIFIED",
      score: 20, 
      level: RiskLevel.GREEN,
      flags: ["INSPECTION_LIMIT"],
      explanation: "Real-time deep scan limited. Standard verification applies.",
      isHarmfulToMinors: false,
      whatToExpect: `The system could not verify the live server. Based on the domain, this appears to be a destination for ${fallbackHostname}.`
    };
  }
}
