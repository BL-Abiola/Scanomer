'use client';
import React, { useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onCancel: () => void;
}

const qrcodeRegionId = "qr-code-reader";

export function QrScanner({ onScanSuccess, onCancel }: QrScannerProps) {
  useEffect(() => {
    const html5QrCode = new Html5Qrcode(qrcodeRegionId, /* verbose= */ false);
    let isScannerStopped = false;
    let scannerStarted = false;

    const qrCodeSuccessCallback = (decodedText: string) => {
        if (!isScannerStopped) {
            isScannerStopped = true;
            onScanSuccess(decodedText);
        }
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    const startScanner = async () => {
        try {
            await html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback, undefined);
            scannerStarted = true;
        } catch (err) {
            console.log("Unable to start scanning with back camera, trying another camera.", err);
            try {
                await html5QrCode.start({}, config, qrCodeSuccessCallback, undefined);
                scannerStarted = true;
            } catch (err2) {
                console.error("Failed to start QR code scanner with any camera.", err2);
            }
        }
    };

    startScanner();

    return () => {
        isScannerStopped = true;
        if (scannerStarted) {
            html5QrCode.stop().catch((err) => {
                // This can happen if the scanner is already stopped.
                // We can safely ignore this error.
                console.log("QR scanner stop resulted in error, probably already stopped.", err);
            });
        }
    };
  }, [onScanSuccess]);

  return (
    <div className="space-y-4">
      <div id={qrcodeRegionId} className="w-full" />
      <Button
        type="button"
        variant="outline"
        className="w-full text-lg"
        onClick={onCancel}
      >
        Cancel Scan
      </Button>
    </div>
  );
}
