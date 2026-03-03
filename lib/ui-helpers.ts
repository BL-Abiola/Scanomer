import type React from 'react';
import {
  Globe,
  CreditCard,
  Wifi,
  Contact,
  Mail,
  Phone,
  Download,
  FileText,
  AlertCircle,
} from 'lucide-react';
import type { AnalysisResult, QrType } from '@/lib/types';


export const getTypeIcon = (type: QrType): React.ElementType => {
  const iconMap: Record<QrType, React.ElementType> = {
    Website: Globe,
    Payment: CreditCard,
    'Wi-Fi': Wifi,
    Contact: Contact,
    Email: Mail,
    Phone: Phone,
    'App Download': Download,
    File: FileText,
    Unknown: AlertCircle,
  };
  return iconMap[type] || AlertCircle;
};

export const getSignalColorClasses = (signal: AnalysisResult['signal']) => {
  switch (signal) {
    case 'EMERALD': return { border: 'border-l-[hsl(var(--chart-1))]', iconBg: 'bg-[hsl(var(--chart-1)/0.1)]', iconText: 'text-[hsl(var(--chart-1))]' };
    case 'INDIGO': return { border: 'border-l-[hsl(var(--chart-2))]', iconBg: 'bg-[hsl(var(--chart-2)/0.1)]', iconText: 'text-[hsl(var(--chart-2))]' };
    case 'AMBER': return { border: 'border-l-[hsl(var(--chart-3))]', iconBg: 'bg-[hsl(var(--chart-3)/0.1)]', iconText: 'text-[hsl(var(--chart-3))]' };
    case 'AMETHYST': return { border: 'border-l-[hsl(var(--chart-4))]', iconBg: 'bg-[hsl(var(--chart-4)/0.1)]', iconText: 'text-[hsl(var(--chart-4))]' };
    case 'CRIMSON': return { border: 'border-l-[hsl(var(--chart-5))]', iconBg: 'bg-[hsl(var(--chart-5)/0.1)]', iconText: 'text-[hsl(var(--chart-5))]' };
    default: return { border: 'border-l-gray-500', iconBg: 'bg-gray-500/10', iconText: 'text-gray-400' };
  }
};
