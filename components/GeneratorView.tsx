
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Download, Sparkles, MessageSquare, Wand2, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';
import { nlpToSchema } from '../services/geminiService';

interface GeneratorViewProps {
  onBack: () => void;
}

export const GeneratorView: React.FC<GeneratorViewProps> = ({ onBack }) => {
  const [activeMode, setActiveMode] = useState<'text' | 'ai'>('text');
  
  // Manual Text State
  const [manualText, setManualText] = useState('');
  
  // AI State
  const [intent, setIntent] = useState('');
  const [aiGeneratedResult, setAiGeneratedResult] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiGenerate = async () => {
    if (!intent.trim()) return;
    setIsAiLoading(true);
    setAiGeneratedResult(''); 
    try {
      const result = await nlpToSchema(intent);
      setAiGeneratedResult(result);
    } catch (err) {
      console.error(err);
      alert('The AI engine hit a snag. Please re-describe your request.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const download = (id: string) => {
    const svg = document.getElementById(id);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `scanrust-${activeMode}-${Date.now()}.png`;
      link.href = pngFile;
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 w-full max-w-lg mx-auto">
      <button 
        onClick={onBack} 
        className="flex items-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-bold text-xs uppercase tracking-widest space-x-2 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Hub</span>
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 transition-all duration-300">
        {/* Tab Navigation */}
        <div className="flex bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => setActiveMode('text')}
            className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-2 ${activeMode === 'text' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600' : 'text-slate-400 dark:text-slate-600'}`}
          >
            <MessageSquare size={14} />
            <span>Manual Input</span>
          </button>
          <button 
            onClick={() => setActiveMode('ai')}
            className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-2 ${activeMode === 'ai' ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 border-b-2 border-purple-600' : 'text-slate-400 dark:text-slate-600'}`}
          >
            <Wand2 size={14} />
            <span>AI Assistant</span>
          </button>
        </div>

        <div className="p-8 sm:p-10 min-h-[480px]">
          {activeMode === 'text' ? (
            /* MANUAL MODE SPACE */
            <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 dark:text-white italic uppercase tracking-tight">Manual Constructor</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Enter exactly what you want inside the QR code.</p>
              </div>
              
              <div className="relative group">
                <textarea 
                  className="w-full h-40 p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-600 transition-all text-sm dark:text-white outline-none resize-none font-medium"
                  placeholder="e.g. https://google.com or Wi-Fi details"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                />
                {manualText && (
                  <button 
                    onClick={() => setManualText('')}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {manualText && (
                <div className="flex flex-col items-center space-y-8 pt-8 border-t border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-500">
                  <div className="p-6 bg-white rounded-[2rem] shadow-2xl ring-1 ring-slate-100">
                    <QRCodeSVG id="qr-manual" value={manualText} size={180} level="H" />
                  </div>
                  
                  <button 
                    onClick={() => download('qr-manual')}
                    className="w-full bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-black text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center space-x-3 transition-all active:scale-95 shadow-xl"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Manual QR</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* AI MODE SPACE */
            <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400">
                  <Sparkles size={16} />
                  <h3 className="text-xl font-black italic uppercase tracking-tight">AI Content Engine</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Describe what you need. AI will generate passwords, primes, or formatted data for you.
                </p>
              </div>

              <div className="relative group">
                <textarea 
                  className="w-full h-40 p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 dark:focus:border-purple-600 transition-all text-sm dark:text-white outline-none resize-none font-medium"
                  placeholder="Example: Generate a Wi-Fi QR for SSID 'Lab' with a password containing 4 random primes and symbols."
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                />
                {intent && !isAiLoading && (
                  <button 
                    onClick={() => {setIntent(''); setAiGeneratedResult('');}}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <button 
                onClick={handleAiGenerate}
                disabled={isAiLoading || !intent.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center space-x-3 transition-all active:scale-95 shadow-xl shadow-purple-200 dark:shadow-none"
              >
                {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isAiLoading ? 'Synthesizing...' : 'Execute AI Intent'}</span>
              </button>

              {aiGeneratedResult && (
                <div className="flex flex-col items-center space-y-8 pt-8 border-t border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-500">
                  <div className="w-full space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span>AI Generated Content</span>
                      </div>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 break-all font-mono text-[11px] text-emerald-800 dark:text-emerald-300">
                      {aiGeneratedResult}
                    </div>
                  </div>
                  
                  <div className="p-6 bg-white rounded-[2rem] shadow-2xl ring-1 ring-slate-100">
                    <QRCodeSVG id="qr-ai" value={aiGeneratedResult} size={180} level="H" />
                  </div>
                  
                  <button 
                    onClick={() => download('qr-ai')}
                    className="w-full bg-purple-900 dark:bg-purple-100 dark:text-purple-900 hover:bg-purple-950 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center space-x-3 transition-all active:scale-95 shadow-xl"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download AI Payload</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
