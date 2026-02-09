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

    // Base awareness
    awarenessPoints.push('Always be sure you trust the destination domain.');

    // Crimson Signals
    if (IP_LOGGERS.some(logger => hostname.includes(logger))) {
        signal = 'CRIMSON';
        awarenessPoints.push('This link is from a service known for IP logging. We recommend not to open it.');
    }

    // Amethyst Signals
    if (signal === 'EMERALD') {
        if (PAYMENT_PROVIDERS.some(p => hostname.includes(p)) || TRANSACTIONAL_KEYWORDS.some(k => url.pathname.includes(`/${k}`))) {
            signal = 'AMETHYST';
            awarenessPoints.push('This appears to be a payment or login page. Ensure the site is secure (HTTPS) before entering info.');
            type = 'Payment';
        }
    }
    
    // Amber Signals
    if (signal === 'EMERALD') {
        if (SHORTENERS.some(shortener => hostname.includes(shortener))) {
            signal = 'AMBER';
            awarenessPoints.push(`It uses a URL shortener (${hostname}), which hides the final destination. Proceed with caution.`);
        }
        const foundTrackingParams = [...url.searchParams.keys()].filter(key => TRACKING_PARAMS.includes(key.toLowerCase()));
        if (foundTrackingParams.length > 0) {
            if (signal === 'EMERALD') signal = 'AMBER';
            awarenessPoints.push('This link includes tracking parameters to monitor your activity.');
            hiddenVariables.push(...foundTrackingParams);
        }
    }

    let description = 'This is a link to a website.';
    if (type === 'Payment') {
        description = 'This is a link for a payment or account login.';
    } else if (type === 'App Download') {
        description = 'This is a link to download an app.';
        awarenessPoints.push('Only install apps from trusted developers and official app stores.');
    }
      
    const action = `It will open your browser and go to ${hostname}.`;
    
    const awareness = awarenessPoints.join(' ');

    return { type, signal, description, action, awareness, rootDomain: hostname, hiddenVariables };
}

function analyzeSimpleProtocol(content: string, type: QrType): Omit<AnalysisResult, 'qrContent'> {
    const signal: Signal = 'INDIGO';
    let description = 'This QR code contains data for a device action.';
    let action = 'Your device will perform a native action.';
    let awareness = 'This is a standard action for your device.';

    switch (type) {
        case 'Wi-Fi':
            const ssidMatch = content.match(/S:([^;]+);/);
            const ssid = ssidMatch ? ssidMatch[1] : 'an unknown network';
            description = 'Contains credentials to join a Wi-Fi network.';
            action = `Your device will ask to connect to the network named "${ssid}".`;
            awareness = 'This will automatically connect you to the Wi-Fi network. Only join networks you trust.';
            break;
        case 'Contact':
            description = 'This is a vCard with contact information.';
            action = 'Your device will offer to save a new contact.';
            awareness = 'Review the details (name, number, email) before adding it to your address book.';
            break;
        case 'Email':
            const emailTo = content.split('?')[0].replace('mailto:', '');
            description = 'This QR code will start a new email.';
            action = `It will open your email app with a new draft addressed to ${emailTo}.`;
            awareness = 'The body and subject may be pre-filled. Check the content before sending.';
            break;
        case 'Phone':
            const phoneNum = content.replace('tel:', '');
            description = 'This contains a phone number to call.';
            action = `Your device will prompt you to call the number ${phoneNum}.`;
            awareness = 'Check that you recognize the number before placing the call.';
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
                description: 'Contains an embedded file for download.',
                action: 'Your device will prompt you to download a file.',
                awareness: 'This is a high-risk action. The file could be malicious. Do not open files from sources you do not trust completely.',
            };
            break;
            
        case 'Unknown':
        default:
            result = {
                type: 'Unknown',
                signal: 'AMBER',
                description: 'Contains plain text or an unrecognized data format.',
                action: 'Your device will show the raw text or offer a web search.',
                awareness: 'This is not a standard scannable action. It could be a simple message, a unique code, or a private key. Be cautious if you don\'t recognize it.',
            };
            break;
    }

    return { ...result, qrContent: trimmedContent };
}
