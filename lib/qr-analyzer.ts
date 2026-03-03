import type { AnalysisResult, QrType, Signal } from '@/lib/types';

// Known URL shorteners
const SHORTENERS = [
  'bit.ly', 't.co', 'goo.gl', 'tinyurl.com', 'is.gd', 'buff.ly', 'adf.ly', 'rebrand.ly',
];

// Known tracking parameters
const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'mc_cid', 'mc_eid',
];

// Known IP logger domains
const IP_LOGGERS = [
  'grabify.link', 'iplogger.org', 'blasze.com', 'tracking-link.com', 'short-link.org',
];

// Refined Adult/Malicious keywords - carefully selected to avoid false positives
const ADULT_KEYWORDS = ['porn', 'xxx', 'sex', 'nude', 'erotic', 'adult', 'redtube', 'pornhub', 'xhamster'];

// Known payment/login keywords
const TRANSACTIONAL_KEYWORDS = ['login', 'signin', 'auth', 'oauth', 'account', 'secure', 'wallet'];
const PAYMENT_PROVIDERS = ['paypal.me', 'cash.app', 'venmo.com', 'stripe.link', 'checkout.stripe.com'];

// Robust URL detection regex
const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;

function classifyQrType(content: string): QrType {
  const c = content.toLowerCase();
  
  if (c.startsWith('http://') || c.startsWith('https://') || URL_REGEX.test(c)) {
    for (const provider of PAYMENT_PROVIDERS) {
      if (c.includes(provider)) return 'Payment';
    }
    for (const keyword of TRANSACTIONAL_KEYWORDS) {
      if (c.includes(`/${keyword}`)) return 'Payment';
    }
    if (c.startsWith('market://') || c.startsWith('itms-apps://') || c.includes('.apk') || c.includes('play.google.com') || c.includes('apps.apple.com')) {
      return 'App Download';
    }
    return 'Website';
  }
  
  if (c.startsWith('wifi:')) return 'Wi-Fi';
  if (c.startsWith('begin:vcard')) return 'Contact';
  if (c.startsWith('mailto:')) return 'Email';
  if (c.startsWith('tel:')) return 'Phone';
  if (c.startsWith('data:application')) return 'File';
  return 'Unknown';
}

function analyzeWebsite(content: string, type: QrType): Omit<AnalysisResult, 'qrContent'> {
  let url: URL;
  let hostname = '';
  
  try {
    const urlToParse = content.startsWith('http') ? content : `https://${content}`;
    url = new URL(urlToParse);
    hostname = url.hostname.replace(/^www\./, '');
  } catch (e) {
    return { 
      type: 'Unknown', 
      signal: 'AMBER', 
      description: 'Potential URL or text content.', 
      action: 'Your device will treat this as a link or text search.', 
      awareness: 'The content format is slightly unusual but may be a valid domain.' 
    };
  }

  const awarenessPoints: string[] = [];
  let signal: Signal = 'EMERALD';
  let isPhishingAttempt = false;
  let isAdultContent = false;

  // --- Signal Analysis ---

  // 1. Adult Content Heuristic
  if (ADULT_KEYWORDS.some(keyword => hostname.includes(keyword))) {
    signal = 'CRIMSON';
    isAdultContent = true;
    awarenessPoints.push('Restricted / NSFW content signature detected.');
  }

  // 2. Critical Obscurity & Phishing
  if (IP_LOGGERS.some(logger => hostname.includes(logger))) {
    signal = 'CRIMSON';
    isPhishingAttempt = true;
    awarenessPoints.push('Known logging service detected.');
  } else if (url.username || url.password) {
    signal = 'CRIMSON';
    isPhishingAttempt = true;
    awarenessPoints.push('Deceptive URL format detected.');
  }

  // 3. Transactional (Neutral/Indigo)
  if (PAYMENT_PROVIDERS.some(p => hostname.includes(p)) || TRANSACTIONAL_KEYWORDS.some(k => url.pathname.includes(`/${k}`))) {
    if (signal === 'EMERALD') signal = 'AMETHYST';
    type = 'Payment';
  }
  
  // 4. Obscured (Warning/Amber)
  if (SHORTENERS.some(shortener => hostname.includes(shortener))) {
    if (signal === 'EMERALD') signal = 'AMBER';
    awarenessPoints.push(`Redirect service detected (${hostname}).`);
  }

  const foundTrackingParams = [...url.searchParams.keys()].filter(key => TRACKING_PARAMS.includes(key.toLowerCase()));
  if (foundTrackingParams.length > 0) {
    if (signal === 'EMERALD') signal = 'AMBER';
    awarenessPoints.push('Tracking parameters detected.');
  }

  // --- Summary Generation ---
  let description: string;
  if (isAdultContent) {
    description = 'Restricted / NSFW.';
  } else if (isPhishingAttempt) {
    description = 'Dangerous link signature.';
  } else if (type === 'Payment') {
    description = 'Transactional portal.';
  } else if (type === 'App Download') {
    description = 'App installation link.';
  } else {
    description = 'Standard website.';
  }

  const action = `Opens browser to ${hostname}.`;
  const awareness = awarenessPoints.length > 0 ? awarenessPoints.join(' ') : 'Trust the destination domain before proceeding.';

  return { type, signal, description, action, awareness, rootDomain: hostname };
}

function analyzeSimpleProtocol(content: string, type: QrType): Omit<AnalysisResult, 'qrContent'> {
  const signal: Signal = 'INDIGO';
  let description = 'Device action data.';
  let action = 'Your device will perform a native action.';
  let awareness = 'Standard local system interaction.';

  switch (type) {
    case 'Wi-Fi':
      const ssidMatch = content.match(/S:([^;]+);/);
      const ssid = ssidMatch ? ssidMatch[1] : 'unknown network';
      description = 'Wi-Fi credentials.';
      action = `Connect to "${ssid}".`;
      break;
    case 'Contact':
      description = 'vCard contact.';
      action = 'Save a new contact.';
      break;
    case 'Email':
      const emailTo = content.split('?')[0].replace('mailto:', '');
      description = 'Email draft.';
      action = `Email to ${emailTo}.`;
      break;
    case 'Phone':
      const phoneNum = content.replace('tel:', '');
      description = 'Phone trigger.';
      action = `Call ${phoneNum}.`;
      break;
  }
  return { type, signal, description, action, awareness };
}

export function analyzeQrContent(content: string): AnalysisResult {
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return { type: 'Unknown', signal: 'CRIMSON', description: 'Empty data.', action: 'No action.', awareness: 'No data provided.', qrContent: ''};
  }

  const type = classifyQrType(trimmedContent);
  let result: Omit<AnalysisResult, 'qrContent'>;

  switch (type) {
    case 'Website':
    case 'Payment':
    case 'App Download':
      result = analyzeWebsite(trimmedContent, type);
      break;
    case 'Wi-Fi':
    case 'Contact':
    case 'Email':
    case 'Phone':
      result = analyzeSimpleProtocol(trimmedContent, type);
      break;
    case 'File':
      result = {
        type: 'File',
        signal: 'CRIMSON',
        description: 'Direct file download.',
        action: 'Downloads an external file.',
        awareness: 'High risk. Files can contain harmful code.',
      };
      break;
    default:
      if (URL_REGEX.test(trimmedContent)) {
        result = analyzeWebsite(trimmedContent, 'Website');
      } else {
        result = {
          type: 'Unknown',
          signal: 'AMBER',
          description: 'Unrecognized data format.',
          action: 'View as text or search.',
          awareness: 'Unknown data origin. Use caution.',
        };
      }
      break;
  }

  return { ...result, qrContent: trimmedContent };
}
