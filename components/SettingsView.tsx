
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Moon, Sun, Key, ExternalLink, CheckCircle2, Shield, Settings as SettingsIcon, Info } from 'lucide-react';

interface SettingsViewProps {
  onBack: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack, theme, toggleTheme }) => {
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleManageKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      // Assume success as per environment rules
      setHasKey(true);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 w-full max-w-lg mx-auto">
      <button 
        onClick={onBack} 
        className="flex items-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-xs uppercase tracking-widest space-x-2 mb-4 group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        <span>Return to Scanner</span>
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 transition-all duration-300">
        <div className="p-8 sm:p-10 space-y-10">
          <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-8">
            <div className="flex items-center space-x-3 mb-1">
              <SettingsIcon className="w-6 h-6 text-slate-400" />
              <h2 className="text-3xl font-black italic uppercase tracking-tight text-slate-800 dark:text-white">Settings</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">System configuration & AI connectivity.</p>
          </div>

          {/* Appearance Section */}
          <div className="space-y-5">
            <div className="flex items-center space-x-2 text-slate-400 dark:text-slate-500">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Appearance</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => theme === 'dark' && toggleTheme()}
                className={`p-6 rounded-3xl border-2 flex flex-col items-center space-y-3 transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50/50 text-blue-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
              >
                <Sun size={24} />
                <span className="text-[10px] font-black uppercase">Light</span>
              </button>
              <button 
                onClick={() => theme === 'light' && toggleTheme()}
                className={`p-6 rounded-3xl border-2 flex flex-col items-center space-y-3 transition-all ${theme === 'dark' ? 'border-blue-500 bg-blue-900/20 text-blue-400' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
              >
                <Moon size={24} />
                <span className="text-[10px] font-black uppercase">Dark</span>
              </button>
            </div>
          </div>

          {/* API Section */}
          <div className="space-y-5">
            <div className="flex items-center space-x-2 text-slate-400 dark:text-slate-500">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">AI Intelligence</span>
            </div>

            <div className="p-8 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${hasKey ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'}`}>
                    {hasKey ? <CheckCircle2 size={20} /> : <Key size={20} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">Gemini API Status</h4>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${hasKey ? 'text-emerald-500' : 'text-blue-500'}`}>
                      {hasKey ? 'Verified & Connected' : 'Ready to Link'}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Scanrust uses advanced AI to detect malware, phishing, and pornography. Connect your Google Gemini key to enable these high-intensity security features.
              </p>

              <div className="space-y-3">
                <button 
                  onClick={handleManageKey}
                  className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-3 transition-all active:scale-95 shadow-xl"
                >
                  <Key size={16} />
                  <span>{hasKey ? 'Update API Key' : 'Secure API Login'}</span>
                </button>
                
                <div className="flex items-center justify-center space-x-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  <Shield size={10} className="text-emerald-500" />
                  <span>Encrypted by System Vault</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center space-x-2 hover:underline"
                >
                  <Info size={12} />
                  <span>Get an API key from Google AI Studio</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
