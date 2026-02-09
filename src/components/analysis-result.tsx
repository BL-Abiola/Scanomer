'use client';

import type React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { AnalysisResult, QrType, Signal } from '@/lib/types';
import {
  Globe,
  CreditCard,
  Wifi,
  Contact,
  Mail,
  Phone,
  Download,
  File,
  HelpCircle,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Fingerprint,
  AlertTriangle,
} from 'lucide-react';

interface AnalysisResultDisplayProps {
  result: AnalysisResult | null;
  isLoading: boolean;
}

const signalInfoMap: Record<
  Signal,
  {
    className: string;
    Icon: React.ElementType;
    label: string;
    description: string;
  }
> = {
  EMERALD: {
    className: 'bg-emerald-500 hover:bg-emerald-500 text-white',
    Icon: ShieldCheck,
    label: 'Emerald',
    description: 'Transparent: Standard, direct action.',
  },
  INDIGO: {
    className: 'bg-indigo-500 hover:bg-indigo-500 text-white',
    Icon: Fingerprint,
    label: 'Indigo',
    description: 'Functional: Offline or device-specific action.',
  },
  AMBER: {
    className: 'bg-amber-500 hover:bg-amber-500 text-white',
    Icon: AlertTriangle,
    label: 'Amber',
    description: 'Obscured: Contains redirects or tracking.',
  },
  AMETHYST: {
    className: 'bg-violet-500 hover:bg-violet-500 text-white',
    Icon: ShieldQuestion,
    label: 'Amethyst',
    description: 'Transactional: Involves a login or payment.',
  },
  CRIMSON: {
    className: 'bg-red-500 hover:bg-red-500 text-white',
    Icon: ShieldAlert,
    label: 'Crimson',
    description: 'Critical Obscurity: High potential for obfuscation.',
  },
};

const typeIconMap: Record<QrType, React.ElementType> = {
  Website: Globe,
  Payment: CreditCard,
  'Wi-Fi': Wifi,
  Contact: Contact,
  Email: Mail,
  Phone: Phone,
  'App Download': Download,
  File: File,
  Unknown: HelpCircle,
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="space-y-1">
    <h3 className="font-semibold text-muted-foreground">{title}</h3>
    <div className="text-foreground text-base">{children}</div>
  </div>
);

export function AnalysisResultDisplay({
  result,
  isLoading,
}: AnalysisResultDisplayProps) {
  if (isLoading) {
    return <ResultSkeleton />;
  }

  if (!result) {
    return null;
  }

  const TypeIcon = typeIconMap[result.type] || HelpCircle;
  const signalInfo = signalInfoMap[result.signal];

  return (
    <Card className="w-full shadow-lg animate-in fade-in-50">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <TypeIcon className="w-6 h-6" />
              <span>Type: {result.type}</span>
            </CardTitle>
            {result.rootDomain && (
              <CardDescription className="text-base mt-1">
                Root Domain: {result.rootDomain}
              </CardDescription>
            )}
          </div>
          <Badge
            className={`flex items-center gap-2 text-sm ${signalInfo.className}`}
            aria-label={`Signal: ${signalInfo.label}. ${signalInfo.description}`}
          >
            <signalInfo.Icon className="w-4 h-4" />
            <span>{signalInfo.label}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Section title="What this QR code does:">
          <p>{result.description}</p>
        </Section>
        <Section title="What will happen if you open it:">
          <p>{result.action}</p>
        </Section>
        <Section title="What to be aware of:">
          <p>{result.awareness}</p>
          {result.hiddenVariables && result.hiddenVariables.length > 0 && (
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2">
              {result.hiddenVariables.map((variable, index) => (
                <li key={index}>
                  Found parameter: <code>{variable}</code>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </CardContent>
    </Card>
  );
}

function ResultSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-64 mt-2" />
          </div>
          <Skeleton className="h-7 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-5 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-5 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      </CardContent>
    </Card>
  );
}
