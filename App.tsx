
import React, { useState, useCallback, useEffect } from 'react';
import { ShieldCheck, QrCode, Upload, HelpCircle, Settings, Search, Send, AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import jsQR from 'jsqr';
import { ScannerView } from './components/ScannerView';
import { ReportCard } from './components/ReportCard';
import { GeneratorView } from './components/GeneratorView';
import { SettingsView } from './components/SettingsView';
import { analyzePayload } from './services/analyzeService';
import { AnalysisResult } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'scanner' | 'generator' | 'settings'>('home');
  const [report, setReport] = useState<AnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    }
    return 'light';
  });
  const [manualUrl, setManualUrl] = useState('');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleScan = useCallback(async (content: string) => {
    if (!content) return;
    setIsProcessing(true);
    setGlobalError(null);
    setView('home');
    try {
      const result = await analyzePayload(content);
      setReport(result);
    } catch (err: any) {
      console.error(err);
      setGlobalError(err?.message || "An unexpected error occurred during analysis.");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setGlobalError(null);
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onerror = () => {
      setGlobalError("Failed to read the uploaded image file.");
      setIsProcessing(false);
    };
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => {
        setGlobalError("The uploaded file is not a valid image.");
        setIsProcessing(false);
      };
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setGlobalError("Could not initialize image processing context.");
          setIsProcessing(false);
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          handleScan(code.data);
        } else {
          setGlobalError("No valid QR code was detected in the uploaded image.");
          setIsProcessing(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleManualCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualUrl.trim()) {
      handleScan(manualUrl.trim());
      setManualUrl('');
    }
  };

  const reset = () => {
    setReport(null);
    setGlobalError(null);
    setView('home');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={reset}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">Scanrust</span>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button 
              onClick={() => { setView('generator'); setGlobalError(null); setReport(null); }}
              className="text-sm font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
            >
              Create QR
            </button>
            <button 
              onClick={() => { setView('settings'); setGlobalError(null); setReport(null); }}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg">
          
          {isProcessing ? (
            <div className="text-center space-y-4 animate-pulse">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Analyzing Data...</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Performing zero-trust heuristic inspection.</p>
            </div>
          ) : globalError ? (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 w-full max-w-lg mx-auto">
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-2xl border border-red-100 dark:border-red-900/30">
                <div className="p-10 text-center space-y-4 bg-red-50/50 dark:bg-red-950/20">
                  <div className="flex justify-center">
                    <div className="p-4 rounded-3xl bg-red-100 dark:bg-red-900/30">
                      <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black italic uppercase tracking-tight text-red-700 dark:text-red-400">
                      Processing Failure
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed">
                      {globalError}
                    </p>
                  </div>
                </div>
                <div className="p-8">
                  <button 
                    onClick={reset}
                    className="w-full bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-black text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center space-x-3 transition-all active:scale-95 shadow-xl"
                  >
                    <RefreshCw size={14} />
                    <span>Try Another Scan</span>
                  </button>
                </div>
              </div>
            </div>
          ) : report ? (
            <ReportCard report={report} onReset={reset} />
          ) : view === 'settings' ? (
            <SettingsView 
              onBack={() => setView('home')} 
              theme={theme} 
              toggleTheme={toggleTheme} 
            />
          ) : view === 'scanner' ? (
            <ScannerView onScan={handleScan} onCancel={() => setView('home')} />
          ) : view === 'generator' ? (
            <GeneratorView onBack={() => setView('home')} />
          ) : (
            <div className="space-y-8 text-center animate-in fade-in duration-500">
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Scan & Check Safely.</h1>
                <p className="text-slate-500 dark:text-slate-400">Verify links and QR codes before they touch your device.</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 space-y-6 shadow-xl dark:shadow-2xl border border-slate-100 dark:border-slate-800">
                {/* Manual Link Input */}
                <form onSubmit={handleManualCheck} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-12 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent transition-all text-sm outline-none dark:text-white"
                    placeholder="Paste a link to check..."
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={!manualUrl.trim()}
                    className="absolute inset-y-2 right-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl transition-colors flex items-center justify-center"
                  >
                    <Send size={16} />
                  </button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
                  <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold"><span className="px-3 bg-white dark:bg-slate-900 text-slate-400">or use camera</span></div>
                </div>

                <button 
                  onClick={() => setView('scanner')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 shadow-lg shadow-blue-200 dark:shadow-none transition-transform active:scale-95"
                >
                  <QrCode className="w-6 h-6" />
                  <span>Start Scanning</span>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
                  <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold"><span className="px-3 bg-white dark:bg-slate-900 text-slate-400">or upload</span></div>
                </div>

                <label className="w-full border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all rounded-2xl p-6 flex flex-col items-center cursor-pointer group">
                  <Upload className="w-8 h-8 text-slate-300 dark:text-slate-700 group-hover:text-blue-500 mb-2 transition-colors" />
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">Upload Image to Scan</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileUpload} 
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="p-8 text-center text-slate-400 dark:text-slate-600 text-[10px] uppercase tracking-widest font-bold">
        &copy; {new Date().getFullYear()} Scanrust Suite &bull; Privacy First
      </footer>
    </div>
  );
};

export default App;
