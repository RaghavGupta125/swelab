import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';

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

      // Slight timeout to allow DOM element to mount
      const timer = setTimeout(async () => {
        try {
          html5QrCode = new Html5Qrcode(scannerElementId);
          scannerRef.current = html5QrCode;

          const cameras = await Html5Qrcode.getCameras();
          if (cameras && cameras.length > 0) {
            // Default to environment-facing camera if available
            const cameraId = cameras.length > 1 ? cameras[cameras.length - 1].id : cameras[0].id;

            await html5QrCode.start(
              cameraId,
              {
                fps: 10,
                qrbox: { width: 250, height: 250 }
              },
              (decodedText) => {
                // Success callback
                try {
                  // If JSON payload was encoded, parse it
                  const parsed = JSON.parse(decodedText);
                  if (parsed.token) {
                    onScanSuccess(parsed.token);
                  } else {
                    onScanSuccess(decodedText);
                  }
                } catch (e) {
                  onScanSuccess(decodedText);
                }
                stopScanner();
                onClose();
              },
              (errorMessage) => {
                // Ignore frequent scanning noise
              }
            );
            setIsStarting(false);
          } else {
            setScannerError('No camera detected on this terminal. Please use manual code lookup.');
            setIsStarting(false);
          }
        } catch (err) {
          console.warn('[QR Scanner start error]:', err);
          setScannerError('Camera access unavailable or permission denied. Please enter token or search manually.');
          setIsStarting(false);
        }
      }, 300);

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
      } catch (e) {}
      scannerRef.current = null;
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onScanSuccess(manualCode.trim());
    stopScanner();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white text-sm">Gate QR Code Scanner</h3>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Scanner Container */}
        <div className="p-4 flex flex-col items-center">
          <div className="w-full relative rounded-lg overflow-hidden bg-black aspect-square flex items-center justify-center border border-slate-800">
            <div id="hostguard-qr-reader" className="w-full h-full"></div>

            {isStarting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-slate-300">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-400 mb-2" />
                <span className="text-xs">Initializing Gate Camera...</span>
              </div>
            )}
          </div>

          {scannerError && (
            <div className="mt-3 w-full p-2.5 rounded bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{scannerError}</span>
            </div>
          )}

          {/* Manual Entry Fallback (FR-037) */}
          <form onSubmit={handleManualSubmit} className="mt-4 w-full">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Manual Token / Pass ID Fallback
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. TKN-A45X9 or VR2045"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold tracking-wide transition"
              >
                Verify
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
