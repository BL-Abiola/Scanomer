'use client';

import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisResult } from '@/lib/types';
import { getSignalColorClasses, getTypeIcon } from '@/lib/ui-helpers';

export const HistoryItem = ({ item, onClick }: { item: AnalysisResult; onClick: () => void }) => {
  const Icon = getTypeIcon(item.type);
  const colorClasses = getSignalColorClasses(item.signal);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border-l-4 bg-white/5 p-4 text-left transition-all hover:bg-white/10 hover:ring-2 hover:ring-primary/50",
        colorClasses.border
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className={cn('flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg', colorClasses.iconBg, colorClasses.iconText)}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">
              {item.rootDomain || item.type}
            </p>
            <p className="truncate text-sm text-muted-foreground">{item.description}</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
      </div>
    </button>
  );
};
