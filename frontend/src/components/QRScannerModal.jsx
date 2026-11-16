import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';

export const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [scannerError, setScannerError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    let html5QrCode = null;

    if (isOpen) {
      setScannerError('');
      setIsStarting(true);

      const scannerElementId = 'hostguard-qr-reader';
      const timer = setTimeout(async () => {
        try {
          html5QrCode = new Html5Qrcode(scannerElementId);
          scannerRef.current = html5QrCode;

          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            const cameraId = cameras.length > 1 ? cameras[cameras.length - 1].id : cameras[0].id;

            await html5QrCode.start(
              cameraId,
              {
                fps: 15,
                qrbox: { width: 220, height: 220 },
              },
              (decodedText) => {
                try {
                  const parsed = JSON.parse(decodedText);
                  if (parsed.token) {
                    onScanSuccess(parsed.token);
                  } else {
                    onScanSuccess(decodedText);
                  }
                } catch {
                  onScanSuccess(decodedText);
                }
                handleClose();
              },
              () => {
                // Ignore per-frame decode failures
              }
            );
          } else {
            setScannerError('No optical camera detected on this terminal. Use manual token fallback below.');
          }
        } catch (err) {
          setScannerError(err.message || 'Camera hardware unavailable. Use manual token fallback.');
        } finally {
          setIsStarting(false);
        }
      }, 250);

      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    }
  }, [isOpen]);

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
        scannerRef.current.clear();
      } catch {
        // quiet cleanup
      }
      scannerRef.current = null;
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onScanSuccess(manualCode.trim());
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md card shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-base">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse-subtle" />
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-800">
              Optical Pass Verification
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport */}
        <div className="p-5 flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-[280px] bg-black rounded border border-zinc-200 overflow-hidden flex items-center justify-center">
            {/* Corner Crosshairs */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-accent z-10" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-accent z-10" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-accent z-10" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-accent z-10" />

            <div id="hostguard-qr-reader" className="w-full h-full" />

            {isStarting && (
              <div className="absolute inset-0 bg-base/90 flex flex-col items-center justify-center gap-2 z-20">
                <RefreshCw className="w-5 h-5 text-zinc-900 animate-spin" />
                <span className="font-mono text-2xs text-zinc-600">INITIALIZING OPTICAL SENSOR...</span>
              </div>
            )}
          </div>

          {scannerError && (
            <div className="mt-4 w-full p-2.5 rounded bg-status-amberBg border border-status-amberBorder text-status-amber text-xs flex items-start gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-2xs">{scannerError}</span>
            </div>
          )}

          {/* Manual Fallback */}
          <form onSubmit={handleManualSubmit} className="mt-5 w-full pt-4 border-t border-zinc-200">
            <label className="block text-2xs font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
              Manual Token / Pass Reference Entry
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. TKN-A45X9 or VR2045"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 bg-base border border-zinc-200 rounded px-3 py-2 text-xs font-mono text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs text-xs font-semibold rounded font-mono inline-flex items-center gap-1.5 transition-colors"
              >
                <span>VERIFY</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
