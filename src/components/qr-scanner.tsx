'use client';
import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onCancel: () => void;
}

const qrcodeRegionId = "qr-code-reader";

export function QrScanner({ onScanSuccess, onCancel }: QrScannerProps) {
  useEffect(() => {
    const html5QrcodeScanner = new Html5QrcodeScanner(
      qrcodeRegionId,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      false
    );

    const handleSuccess = (decodedText: string) => {
      html5QrcodeScanner.clear();
      onScanSuccess(decodedText);
    };

    html5QrcodeScanner.render(handleSuccess, () => {});

    return () => {
      html5QrcodeScanner.clear().catch(() => {});
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
