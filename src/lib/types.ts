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

export type GenerateImageInput = {
  prompt: string;
  apiKey: string;
};
