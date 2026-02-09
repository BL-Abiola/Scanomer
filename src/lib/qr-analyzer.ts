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

// Known payment/login keywords
const TRANSACTIONAL_KEYWORDS = ['login', 'signin', 'auth', 'oauth', 'account', 'secure', 'wallet'];
const PAYMENT_PROVIDERS = ['paypal.me', 'cash.app', 'venmo.com', 'stripe.link', 'checkout.stripe.com'];

function classifyQrType(content: string): QrType {
  const c = content.toLowerCase();
  if (c.startsWith('http://') || c.startsWith('https://')) {
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
    try {
        url = new URL(content);
    } catch (e) {
        return { type: 'Unknown', signal: 'CRIMSON', description: 'This QR code contains malformed data.', action: 'No action can be taken.', awareness: 'The content is not a valid URL or known data type.' };
    }

    const hostname = url.hostname;
    const awarenessPoints: string[] = [];
    const hiddenVariables: string[] = [];
    let signal: Signal = 'EMERALD';

    // Crimson Signals
    if (IP_LOGGERS.some(logger => hostname.includes(logger))) {
        signal = 'CRIMSON';
        awarenessPoints.push('This link is associated with a service known for IP address logging.');
    }

    // Amethyst Signals
    if (signal === 'EMERALD') {
        if (PAYMENT_PROVIDERS.some(p => hostname.includes(p)) || TRANSACTIONAL_KEYWORDS.some(k => url.pathname.includes(`/${k}`))) {
            signal = 'AMETHYST';
            awarenessPoints.push('This link may lead to a payment or login page.');
            type = 'Payment';
        }
    }
    
    // Amber Signals
    if (signal === 'EMERALD') {
        if (SHORTENERS.some(shortener => hostname.includes(shortener))) {
            signal = 'AMBER';
            awarenessPoints.push(`This link uses a URL shortener (${hostname}). The final destination is obscured.`);
        }
        const foundTrackingParams = [...url.searchParams.keys()].filter(key => TRACKING_PARAMS.includes(key.toLowerCase()));
        if (foundTrackingParams.length > 0) {
            if (signal === 'EMERALD') signal = 'AMBER';
            awarenessPoints.push('This link contains tracking parameters.');
            hiddenVariables.push(...foundTrackingParams);
        }
    }

    const description = type === 'Payment' 
      ? 'This QR code contains a link for a transaction or login.'
      : type === 'App Download' 
      ? 'This QR code contains a link to download an application.'
      : 'This QR code contains a link to a website.';
      
    const action = `Opens your web browser to navigate to ${hostname}.`;
    
    const awareness = awarenessPoints.length > 0 ? awarenessPoints.join(' ') : 'Nothing unusual can be determined from the QR content alone.';

    return { type, signal, description, action, awareness, rootDomain: hostname, hiddenVariables };
}

function analyzeSimpleProtocol(content: string, type: QrType): Omit<AnalysisResult, 'qrContent'> {
    const signal: Signal = 'INDIGO';
    let description = 'This QR code contains data for a device action.';
    let action = 'Your device will perform a native action.';
    let awareness = 'Nothing unusual can be determined from the QR content alone.';

    switch (type) {
        case 'Wi-Fi':
            const ssidMatch = content.match(/S:([^;]+);/);
            const ssid = ssidMatch ? ssidMatch[1] : 'an unknown network';
            description = 'This QR code contains Wi-Fi network credentials.';
            action = `Prompts your device to connect to the Wi-Fi network "${ssid}".`;
            awareness = `Your device will attempt to join the network with the provided credentials. Verify the network name is correct.`;
            break;
        case 'Contact':
            description = 'This QR code contains contact information.';
            action = 'Offers to add a new contact to your address book.';
            awareness = 'Review the contact information before saving.';
            break;
        case 'Email':
            const emailTo = content.split('?')[0].replace('mailto:', '');
            description = 'This QR code creates a new email draft.';
            action = `Opens your default email client to compose a message to ${emailTo}.`;
            awareness = 'The QR code may pre-fill the subject and body of the email.';
            break;
        case 'Phone':
            const phoneNum = content.replace('tel:', '');
            description = 'This QR code contains a phone number.';
            action = `Prompts your device to place a call to ${phoneNum}.`;
            awareness = 'Verify the phone number before confirming the call.';
            break;
    }
    return { type, signal, description, action, awareness };
}

export function analyzeQrContent(content: string): AnalysisResult {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
        return { type: 'Unknown', signal: 'CRIMSON', description: 'The QR code is empty.', action: 'No action will be taken.', awareness: 'No content was provided.', qrContent: ''};
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
                description: 'This QR code contains an embedded file.',
                action: 'Prompts to download or open a file directly on your device.',
                awareness: 'Opening files from unknown sources can be a security risk. This method can hide the true file type and origin.',
            };
            break;
            
        case 'Unknown':
        default:
            result = {
                type: 'Unknown',
                signal: 'AMBER',
                description: 'This QR code contains plain text or an unrecognized data format.',
                action: 'Your device will likely show the text content or offer to search for it.',
                awareness: 'The content is not a standard scannable action. It may be a simple message or a private key.',
            };
            break;
    }

    return { ...result, qrContent: trimmedContent };
}
