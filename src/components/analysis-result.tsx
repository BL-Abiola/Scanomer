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
  FileText,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Fingerprint,
  AlertTriangle,
  Info,
  ScanEye,
  CheckCircle,
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
    className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800',
    Icon: ShieldCheck,
    label: 'Transparent',
    description: 'Standard, direct action.',
  },
  INDIGO: {
    className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    Icon: Fingerprint,
    label: 'Functional',
    description: 'Offline or device-specific action.',
  },
  AMBER: {
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    Icon: AlertTriangle,
    label: 'Obscured',
    description: 'Contains redirects or tracking.',
  },
  AMETHYST: {
    className: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300 border-violet-200 dark:border-violet-800',
    Icon: ShieldQuestion,
    label: 'Transactional',
    description: 'Involves a login or payment.',
  },
  CRIMSON: {
    className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800',
    Icon: ShieldAlert,
    label: 'Critical Obscurity',
    description: 'High potential for obfuscation.',
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
  File: FileText,
  Unknown: AlertCircle,
};

const Section: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({
  title,
  icon: Icon,
  children,
}) => (
  <div className="flex items-start gap-4">
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
    </div>
    <div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <div className="mt-1 text-sm text-muted-foreground">{children}</div>
    </div>
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

  const TypeIcon = typeIconMap[result.type] || AlertCircle;
  const signalInfo = signalInfoMap[result.signal];

  return (
    <Card className="w-full border-none bg-transparent shadow-none">
      <CardHeader className="p-0">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${signalInfo.className.replace(/bg-(.*?-100)/,'bg-$1/50').replace('dark:bg-','dark:bg-opacity-30 dark:bg-')}`}>
                <TypeIcon className="h-6 w-6" />
            </div>
            <div>
                <CardTitle className="text-xl">{result.type}</CardTitle>
                {result.rootDomain && (
                    <CardDescription className="text-base">
                        {result.rootDomain}
                    </CardDescription>
                )}
            </div>
          </div>
          <Badge
            variant="outline"
            className={`flex items-center gap-2 py-1 px-3 text-sm ${signalInfo.className}`}
          >
            <signalInfo.Icon className="h-4 w-4" />
            <span>{signalInfo.label} Signal</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="mt-6 space-y-5 p-0">
        <Section title="Description" icon={Info}>
          <p>{result.description}</p>
        </Section>
        <Section title="Expected Action" icon={CheckCircle}>
          <p>{result.action}</p>
        </Section>
        <Section title="Awareness" icon={ScanEye}>
          <p>{result.awareness}</p>
          {result.hiddenVariables && result.hiddenVariables.length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
              {result.hiddenVariables.map((variable, index) => (
                <li key={index}>
                  Found tracking parameter: <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{variable}</code>
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
    <Card className="w-full border-none bg-transparent shadow-none">
      <CardHeader className="p-0">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="space-y-1">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-5 w-48" />
                </div>
            </div>
          <Skeleton className="h-8 w-32 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="mt-6 space-y-5 p-0">
        <div className="flex items-start gap-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="w-full space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
            </div>
        </div>
        <div className="flex items-start gap-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="w-full space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-full" />
            </div>
        </div>
         <div className="flex items-start gap-4">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="w-full space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/5" />
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
