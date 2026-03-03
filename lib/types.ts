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

export enum RiskLevel {
  GREEN = 'GREEN',   // Safe
  YELLOW = 'YELLOW', // Suspicious
  ORANGE = 'ORANGE', // High Risk
  RED = 'RED'        // Confirmed Threat
}

export interface SecurityReport {
  raw: string;
  type: string;
  score: number; // 0-100
  level: RiskLevel;
  flags: string[];
  explanation: string;
  isHarmfulToMinors: boolean;
  whatToExpect: string;
  siteName?: string;
}

export type AnalysisResult = {
  id: string;
  type: QrType;
  signal: Signal;
  description: string;
  action: string;
  awareness: string;
  rootDomain?: string;
  hiddenVariables?: string[];
  qrContent: string;
  securityReport?: SecurityReport;
};
