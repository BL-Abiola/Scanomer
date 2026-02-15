
import React, { useState, useEffect } from 'react';
import { Shield, Search, Lock, Zap, Database, Globe } from 'lucide-react';

export const TerminalLoader: React.FC = () => {
  const [lines, setLines] = useState<string[]>([]);
  const logSteps = [
    { text: "System Boot: Ephemeral Container Initialized", icon: Lock },
    { text: "Hardware Interface: Optical Relay Established", icon: Shield },
    { text: "Scoring: Running Heuristic Scoring Protocol v4.0", icon: Zap },
    { text: "Redirects: Mapping Volatile Unfurling Route", icon: Globe },
    { text: "Sandbox: Executing Virtual DOM Interrogation", icon: Search },
    { text: "Database: No-Store Persistence Protocol Active", icon: Database },
    { text: "Report: Finalizing Dossier Compilation", icon: Shield }
  ];

  useEffect(() => {
    let currentLine = 0;
    const interval = setInterval(() => {
      if (currentLine < logSteps.length) {
        setLines(prev => [...prev, logSteps[currentLine].text]);
        currentLine++;
      } else {
        clearInterval(interval);
      }
    }, 250);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card border-green-500/20 p-8 rounded-[2rem] w-full font-mono text-[11px] space-y-3 shadow-[0_0_50px_rgba(34,197,94,0.1)] relative overflow-hidden">
      {/* Decorative side bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500/20" />
      
      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
        <div className="flex space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
        </div>
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Security.Daemon.Intercept [LOG]
        </div>
      </div>

      <div className="space-y-2">
        {lines.map((line, i) => (
            <div key={i} className="text-green-500 flex items-center space-x-3 animate-in fade-in slide-in-from-left-2">
            <span className="opacity-30 text-[8px] w-14">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
            <span className="opacity-60 text-green-400">>></span>
            <span className="tracking-wide uppercase italic">{line}</span>
            </div>
        ))}
        {lines.length < logSteps.length && (
            <div className="text-green-500 flex items-center space-x-3">
            <span className="opacity-30 text-[8px] w-14">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
            <span className="opacity-60 text-green-400">>></span>
            <span className="terminal-cursor" />
            </div>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-white/5 text-[8px] text-slate-600 flex justify-between uppercase">
          <span>Targeting: Volatile-Memory</span>
          <span className="animate-pulse">Analyzing...</span>
      </div>
    </div>
  );
};
