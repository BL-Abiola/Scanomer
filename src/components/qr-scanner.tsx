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

    const qrCodeSuccessCallback = (decodedText: string) => {
        if (!isScannerStopped) {
            onScanSuccess(decodedText);
        }
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      qrCodeSuccessCallback,
      undefined // qrCodeErrorCallback
    ).catch((err) => {
      console.log("Unable to start scanning with back camera, trying another camera.", err);
      // Fallback to any available camera
      html5QrCode.start(
          {},
          config,
          qrCodeSuccessCallback,
          undefined
      ).catch(err2 => {
          console.error("Failed to start QR code scanner with any camera.", err2)
      })
    });

    return () => {
        isScannerStopped = true;
        html5QrCode.stop().catch((err) => {
            console.error("Failed to stop QR code scanner.", err);
        });
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
