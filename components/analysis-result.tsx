'use client';

import type React from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { type AnalysisResult, type QrType, type Signal } from '@/lib/types';
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
  Fingerprint,
  AlertTriangle,
  Eye,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface AnalysisResultDisplayProps {
  result: AnalysisResult | null;
  isLoading: boolean;
}

const signalInfoMap: Record<Signal, { className: string; Icon: React.ElementType; label: string; themeGradient: string }> = {
  EMERALD: {
    className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    Icon: ShieldCheck,
    label: 'Safe',
    themeGradient: 'from-emerald-500/10 to-transparent',
  },
  INDIGO: {
    className: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    Icon: Fingerprint,
    label: 'Action',
    themeGradient: 'from-indigo-500/10 to-transparent',
  },
  AMBER: {
    className: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    Icon: AlertTriangle,
    label: 'Warning',
    themeGradient: 'from-amber-500/10 to-transparent',
  },
  AMETHYST: {
    className: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    Icon: Globe,
    label: 'Payment',
    themeGradient: 'from-purple-500/10 to-transparent',
  },
  CRIMSON: {
    className: 'bg-red-500/10 text-red-500 border-red-500/20',
    Icon: ShieldAlert,
    label: 'Threat',
    themeGradient: 'from-red-500/10 to-transparent',
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

export function AnalysisResultDisplay({ result, isLoading }: AnalysisResultDisplayProps) {
  const [logoStage, setLogoStage] = useState<'primary' | 'fallback' | 'icon'>('primary');
  
  useEffect(() => {
    setLogoStage('primary');
  }, [result]);

  if (isLoading) return <ResultSkeleton />;
  if (!result) return null;

  const TypeIcon = typeIconMap[result.type] || AlertCircle;
  const signalInfo = signalInfoMap[result.signal];
  const report = result.securityReport;

  const isUrl = /^(https?:\/\/|www\.)|(\.[a-z]{2,})$/i.test(result.qrContent);
  const displayUrl = result.qrContent.startsWith('http') ? result.qrContent : `https://${result.qrContent}`;
  const screenshotUrl = isUrl ? `https://s.wordpress.com/mshots/v1/${encodeURIComponent(displayUrl)}?w=800&h=600` : null;
  
  const primaryLogo = (isUrl && result.rootDomain) ? `https://logo.clearbit.com/${result.rootDomain}` : null;
  const secondaryLogo = (isUrl && result.rootDomain) ? `https://www.google.com/s2/favicons?sz=128&domain=${result.rootDomain}` : null;

  const isNsfw = report?.isHarmfulToMinors || report?.flags.includes('NSFW') || result.description.toLowerCase().includes('porn') || result.description.toLowerCase().includes('nsfw');

  return (
    <div className="w-full space-y-0">
      {/* Visual Identity Hero */}
      <div className="relative overflow-hidden aspect-[16/7] sm:aspect-[21/8] bg-card border-b">
        {screenshotUrl && (
          <>
            <Image 
              src={screenshotUrl} 
              alt="Website Preview" 
              fill 
              className={cn("object-cover transition-all duration-700", isNsfw ? "blur-3xl scale-125 opacity-30" : "opacity-40")}
              unoptimized
            />
            <div className={cn("absolute inset-0 bg-gradient-to-tr opacity-20", signalInfo.themeGradient)} />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          </>
        )}
        
        <div className="absolute inset-0 flex items-end p-4 sm:p-5">
          <div className="flex items-center gap-3 w-full translate-y-1">
            {isUrl && (logoStage === 'primary' || logoStage === 'fallback') ? (
              <div className="relative h-12 w-12 sm:h-14 sm:w-14 overflow-hidden rounded-2xl border-[2.5px] border-card bg-white p-1.5 shadow-2xl flex-shrink-0 animate-in zoom-in duration-300">
                <Image 
                  src={logoStage === 'primary' ? primaryLogo! : secondaryLogo!} 
                  alt="Logo" 
                  fill 
                  className="object-contain p-1"
                  onError={() => setLogoStage(prev => prev === 'primary' ? 'fallback' : 'icon')}
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-primary/20 text-primary border-[2.5px] border-card shadow-2xl flex-shrink-0">
                <TypeIcon className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-lg font-black tracking-tighter text-foreground truncate uppercase leading-tight drop-shadow-sm">
                {report?.siteName || result.rootDomain || result.type}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className={cn('h-3.5 px-1.5 text-[7px] font-black uppercase tracking-widest border rounded-full', signalInfo.className)}>
                  {signalInfo.label}
                </Badge>
                {isUrl && (
                  <span className="text-[7px] text-muted-foreground font-black opacity-60 uppercase truncate tracking-wider">
                    {result.rootDomain}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-3 sm:p-5 space-y-2">
        {isNsfw && (
          <div className="p-2 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center gap-2 animate-pulse mb-1">
            <ShieldAlert className="h-3 w-3 text-red-600" />
            <span className="text-[8px] font-black text-red-600 uppercase tracking-widest">DANGER: NOT SAFE FOR WORK</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2">
          <div className="p-3 rounded-2xl bg-muted/10 border border-border/10 space-y-0.5">
            <label className="text-[7px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5 opacity-70">
              <Eye className="h-2.5 w-2.5 text-primary" />
              Identity
            </label>
            <p className="text-xs font-bold text-foreground/90 leading-tight">{result.description}</p>
          </div>

          <div className="p-3 rounded-2xl bg-muted/10 border border-border/10 space-y-0.5">
            <label className="text-[7px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5 opacity-70">
              <Zap className="h-2.5 w-2.5 text-primary" />
              Action
            </label>
            <p className="text-xs text-foreground/80 font-semibold leading-tight">{result.action}</p>
          </div>

          <div className="p-3 rounded-2xl bg-muted/10 border border-border/10 space-y-0.5">
            <label className="text-[7px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5 opacity-70">
              <ShieldCheck className="h-2.5 w-2.5 text-primary" />
              Safety Analysis
            </label>
            <p className="text-xs text-foreground/80 font-medium italic leading-tight">
              {report?.explanation || result.awareness}
            </p>
          </div>
        </div>

        {report?.flags && report.flags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1 opacity-80">
            {report.flags.map((flag, idx) => (
              <Badge key={idx} variant="secondary" className="text-[6px] font-black uppercase tracking-widest py-0.5 px-2 rounded-full bg-muted/30 border-none">
                {flag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultSkeleton() {
  return (
    <div className="w-full space-y-0">
      <Skeleton className="h-28 w-full rounded-t-3xl" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}
