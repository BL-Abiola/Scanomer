'use client';

import * as React from 'react';
import { ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalysisResult } from '@/lib/types';
import { getSignalColorClasses, getTypeIcon } from '@/lib/ui-helpers';

interface HistoryItemProps {
  item: AnalysisResult;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const HistoryItem = ({ item, onClick, onDelete }: HistoryItemProps) => {
  const Icon = getTypeIcon(item.type);
  const colorClasses = getSignalColorClasses(item.signal);

  return (
    <div className={cn(
      "group relative flex items-center w-full rounded-xl border-l-4 bg-card border border-border/50 shadow-sm transition-all hover:bg-muted/50 overflow-hidden",
      colorClasses.border
    )}>
      <button
        onClick={onClick}
        className="flex-1 flex items-center justify-between p-3 sm:p-4 text-left min-w-0"
      >
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className={cn('flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-lg', colorClasses.iconBg, colorClasses.iconText)}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm sm:text-base font-semibold text-foreground">
              {item.rootDomain || item.type}
            </p>
            <p className="truncate text-xs sm:text-sm text-muted-foreground font-medium opacity-80">{item.description}</p>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:translate-x-1 transition-transform" />
      </button>
      
      <button 
        onClick={onDelete}
        className="h-full px-4 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 border-l border-border/50 transition-colors"
        title="Delete from history"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};
