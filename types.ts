
export enum RiskLevel {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  ORANGE = 'ORANGE',
  RED = 'RED'
}

export interface AnalysisResult {
  raw: string;
  type: 'URL' | 'WIFI' | 'VCARD' | 'TEXT' | 'CRYPTO' | 'OTP';
  score: number;
  level: RiskLevel;
  flags: string[];
  redirectChain: string[];
  explanation: string;
  previewDescription?: string;
  error?: string;
}

export interface QRPayload {
  ssid?: string;
  password?: string;
  encryption?: 'WPA' | 'WEP' | 'nopass';
  url?: string;
  text?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  cryptoType?: string;
  cryptoAddress?: string;
}
