
import React from 'react';
import { ShieldCheck, AlertTriangle, XCircle, ExternalLink, RefreshCw, ChevronRight, Lock, Eye, AlertCircle, Info } from 'lucide-react';
import { AnalysisResult, RiskLevel } from '../types';

interface ReportCardProps {
  report: AnalysisResult;
  onReset: () => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, onReset }) => {
  const isSafe = report.level === RiskLevel.GREEN;
  const isWarning = report.level === RiskLevel.YELLOW || report.level === RiskLevel.ORANGE;
  const isDanger = report.level === RiskLevel.RED;
  const hasInternalError = !!report.error;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 w-full max-w-lg mx-auto">
      <div className={`bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border ${
          hasInternalError ? 'border-amber-200 dark:border-amber-900/30' : 'border-slate-100 dark:border-slate-800'
      }`}>
        {/* Header Status */}
        <div className={`p-10 text-center space-y-4 ${
          hasInternalError ? 'bg-amber-50/50 dark:bg-amber-950/20' :
          isSafe ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : 
          isWarning ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'bg-red-50/50 dark:bg-red-950/20'
        }`}>
          <div className="flex justify-center">
            <div className={`p-4 rounded-3xl ${
              hasInternalError ? 'bg-amber-100 dark:bg-amber-900/30' :
              isSafe ? 'bg-emerald-100 dark:bg-emerald-900/30' : 
              isWarning ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              {hasInternalError ? <AlertCircle className="w-12 h-12 text-amber-500" /> : (
                <>
                  {isSafe && <ShieldCheck className="w-12 h-12 text-emerald-500" />}
                  {isWarning && <AlertTriangle className="w-12 h-12 text-amber-500" />}
                  {isDanger && <XCircle className="w-12 h-12 text-red-500" />}
                </>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <h2 className={`text-2xl font-black italic uppercase tracking-tight ${
              hasInternalError ? 'text-amber-700 dark:text-amber-400' :
              isSafe ? 'text-emerald-700 dark:text-emerald-400' : 
              isWarning ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'
            }`}>
              {hasInternalError ? 'Inspection Degraded' : (
                  isSafe ? 'System Secure' : 
                  isWarning ? 'Caution Advised' : 'Threat Detected'
              )}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
              {report.explanation}
            </p>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-8 space-y-8 bg-white dark:bg-slate-900">
          {report.error && (
            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20 flex items-start space-x-3">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide leading-relaxed">
                {report.error}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-400 dark:text-slate-500">
              <Lock size={12} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Intercepted Data</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 break-all font-mono text-[11px] text-slate-700 dark:text-slate-300">
              {report.raw}
            </div>
          </div>

          {!hasInternalError && report.previewDescription && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-slate-400 dark:text-slate-500">
                <Eye size={12} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Content Preview</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium italic">
                "{report.previewDescription}"
              </p>
            </div>
          )}
          
          {report.flags.length > 0 && (
            <div className="space-y-3">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Risk Analysis</span>
              <div className="space-y-2">
                {report.flags.map((flag, i) => (
                  <div key={i} className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 space-x-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className={`w-2 h-2 rounded-full ${
                        flag === 'AI_DISRUPTION' ? 'bg-blue-400' :
                        isDanger ? 'bg-red-500' : 'bg-amber-500'
                    }`} />
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col space-y-4 pt-2">
        {report.type === 'URL' && (
          <a 
            href={report.raw}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-sm flex items-center justify-center space-x-3 shadow-xl transition-all active:scale-95 ${
              (isDanger || hasInternalError)
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 dark:shadow-none'
            }`}
          >
            <span>{hasInternalError ? 'Proceed With Caution' : 'Open Verified Link'}</span>
            <ExternalLink size={16} />
          </a>
        )}
        
        <button 
          onClick={onReset}
          className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] text-slate-400 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center space-x-2 transition-colors"
        >
          <RefreshCw size={14} />
          <span>Reset Interceptor</span>
        </button>
      </div>
    </div>
  );
};
