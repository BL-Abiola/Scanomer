
import React, { useRef, useState, useEffect } from 'react';
import jsQR from 'jsqr';
import { X, Camera, RefreshCw, AlertCircle } from 'lucide-react';

interface ScannerViewProps {
  onScan: (content: string) => void;
  onCancel: () => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ onScan, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please enable permissions in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera detected on this device.');
      } else {
        setError('Unable to access camera. Please check your device settings.');
      }
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    let frame: number;
    const check = () => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          try {
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
              onScan(code.data);
              return;
            }
          } catch (qrErr) {
            console.error("QR Decoding failed", qrErr);
          }
        }
      }
      frame = requestAnimationFrame(check);
    };
    frame = requestAnimationFrame(check);
    return () => cancelAnimationFrame(frame);
  }, [onScan]);

  return (
    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300 w-full">
      <div className="w-full bg-slate-900 dark:bg-black rounded-[2.5rem] overflow-hidden relative aspect-square shadow-2xl flex items-center justify-center border border-slate-200 dark:border-slate-800">
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-80" />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Simple Viewfinder */}
        {!error && (
            <div className="relative z-10">
            <div className="viewfinder-box ring-1 ring-white/10">
                {/* Corners */}
                <div className="viewfinder-corner top-0 left-0 border-t border-l rounded-tl-xl border-blue-400" />
                <div className="viewfinder-corner top-0 right-0 border-t border-r rounded-tr-xl border-blue-400" />
                <div className="viewfinder-corner bottom-0 left-0 border-b border-l rounded-bl-xl border-blue-400" />
                <div className="viewfinder-corner bottom-0 right-0 border-b border-r rounded-br-xl border-blue-400" />
                
                {/* Animation Line */}
                <div className="scan-anim bg-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.8)]" />
            </div>
            </div>
        )}

        <button 
          onClick={onCancel}
          className="absolute top-6 right-6 p-3 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors backdrop-blur-md z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-900 p-8 text-center transition-colors z-30">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 rounded-2xl flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-slate-800 dark:text-white">Camera Interface Error</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-xs mx-auto">{error}</p>
              </div>
              <button 
                onClick={startCamera} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 mx-auto transition-all active:scale-95 shadow-lg shadow-blue-200 dark:shadow-none"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Connection</span>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {!error && (
        <p className="mt-8 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">
            Align QR code within optical relay frame
        </p>
      )}
    </div>
  );
};
