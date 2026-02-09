'use client';
import React, { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onCancel: () => void;
}

const qrcodeRegionId = "html5qr-code-full-region";

export function QrScanner({ onScanSuccess, onCancel }: QrScannerProps) {
    const qrCodeScannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        qrCodeScannerRef.current = new Html5Qrcode(qrcodeRegionId, false);
        const qrCodeScanner = qrCodeScannerRef.current;

        const qrCodeSuccessCallback = (decodedText: string) => {
            if (qrCodeScanner.getState() === Html5QrcodeScannerState.SCANNING) {
                qrCodeScanner.stop().then(() => {
                    onScanSuccess(decodedText);
                }).catch(err => console.error("Error stopping scanner", err));
            }
        };

        const startScanner = async () => {
            try {
                await qrCodeScanner.start(
                    { facingMode: 'environment' },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    qrCodeSuccessCallback,
                    undefined
                );
            } catch (err) {
                console.log("Unable to start scanning with back camera, trying another camera.", err);
                try {
                    await qrCodeScanner.start(
                        {},
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        qrCodeSuccessCallback,
                        undefined
                    );
                } catch (err2) {
                    console.error("Failed to start QR code scanner with any camera.", err2);
                }
            }
        };

        startScanner();

        return () => {
            if (qrCodeScanner && qrCodeScanner.getState() === Html5QrcodeScannerState.SCANNING) {
                qrCodeScanner.stop().catch(err => {
                    console.log("Error stopping scanner on unmount, may be already stopped.", err);
                });
            }
        };
    }, [onScanSuccess]);


  return (
    <div className="space-y-4">
      <div id={qrcodeRegionId} className="w-full overflow-hidden rounded-lg border aspect-video" />
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={onCancel}
      >
        <X className="mr-2 h-5 w-5" />
        Cancel Scan
      </Button>
    </div>
  );
}
