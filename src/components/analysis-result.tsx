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
import { cn } from '@/lib/utils';

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
    className: 'bg-[hsl(var(--chart-1)/0.1)] text-[hsl(var(--chart-1))] border-[hsl(var(--chart-1)/0.2)]',
    Icon: ShieldCheck,
    label: 'Transparent',
    description: 'Standard, direct action.',
  },
  INDIGO: {
    className: 'bg-[hsl(var(--chart-2)/0.1)] text-[hsl(var(--chart-2))] border-[hsl(var(--chart-2)/0.2)]',
    Icon: Fingerprint,
    label: 'Functional',
    description: 'Offline or device-specific action.',
  },
  AMBER: {
    className: 'bg-[hsl(var(--chart-3)/0.1)] text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3)/0.2)]',
    Icon: AlertTriangle,
    label: 'Obscured',
    description: 'Contains redirects or tracking.',
  },
  AMETHYST: {
    className: 'bg-[hsl(var(--chart-4)/0.1)] text-[hsl(var(--chart-4))] border-[hsl(var(--chart-4)/0.2)]',
    Icon: ShieldQuestion,
    label: 'Transactional',
    description: 'Involves a login or payment.',
  },
  CRIMSON: {
    className: 'bg-[hsl(var(--chart-5)/0.1)] text-[hsl(var(--chart-5))] border-[hsl(var(--chart-5)/0.2)]',
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
  <div className="flex items-start gap-4 rounded-lg bg-white/5 p-4">
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
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
    <div className="w-full">
      <header className="mb-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className={cn('flex h-14 w-14 items-center justify-center rounded-lg', signalInfo.className.replace('bg-','bg-opacity-20 bg-'))}>
                <TypeIcon className="h-7 w-7" />
            </div>
            <div>
                <h2 className="text-2xl font-bold">{result.type}</h2>
                {result.rootDomain && (
                    <p className="text-base text-muted-foreground">
                        {result.rootDomain}
                    </p>
                )}
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn('flex items-center gap-2 py-1.5 px-3 text-sm', signalInfo.className)}
          >
            <signalInfo.Icon className="h-4 w-4" />
            <span>{signalInfo.label} Signal</span>
          </Badge>
        </div>
      </header>
      <div className="space-y-4">
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
                  Found tracking parameter: <code className="rounded bg-muted/50 px-1 py-0.5 font-mono text-xs">{variable}</code>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="w-full">
      <header className="mb-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-lg bg-white/5" />
                <div className="space-y-2">
                    <Skeleton className="h-7 w-32 bg-white/5" />
                    <Skeleton className="h-5 w-48 bg-white/5" />
                </div>
            </div>
          <Skeleton className="h-8 w-32 rounded-full bg-white/5" />
        </div>
      </header>
      <div className="space-y-4">
        <div className="flex items-start gap-4 rounded-lg bg-white/5 p-4">
            <Skeleton className="h-8 w-8 rounded-md bg-white/10" />
            <div className="w-full space-y-2">
                <Skeleton className="h-4 w-1/4 bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-4/5 bg-white/10" />
            </div>
        </div>
        <div className="flex items-start gap-4 rounded-lg bg-white/5 p-4">
            <Skeleton className="h-8 w-8 rounded-md bg-white/10" />
            <div className="w-full space-y-2">
                <Skeleton className="h-4 w-1/4 bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
            </div>
        </div>
         <div className="flex items-start gap-4 rounded-lg bg-white/5 p-4">
            <Skeleton className="h-8 w-8 rounded-md bg-white/10" />
            <div className="w-full space-y-2">
                <Skeleton className="h-4 w-1/4 bg-white/10" />
                <Skeleton className="h-4 w-full bg-white/10" />
                <Skeleton className="h-4 w-3/5 bg-white/10" />
            </div>
        </div>
      </div>
    </div>
  );
}
