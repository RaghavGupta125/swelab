import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import {
  Shield,
  Clock,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Info,
} from 'lucide-react';

export const DigitalPassView = () => {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [qrPass, setQrPass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPass();
    const interval = setInterval(loadPass, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const loadPass = async () => {
    try {
      const res = await api.getRequest(id);
      if (res.success && res.request) {
        setRequest(res.request);
        setQrPass(res.qrPass);
      }
    } catch (err) {
      setError(err.message || 'Pass not located in system.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-zinc-900" />
        <span className="font-mono text-2xs text-zinc-500 uppercase tracking-wider">
          RETRIEVING CRYPTOGRAPHIC PASS...
        </span>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-status-red mx-auto" />
        <h2 className="text-sm font-mono font-bold text-zinc-900 uppercase">PASS UNAVAILABLE</h2>
        <p className="text-2xs font-mono text-zinc-600">{error || 'Could not retrieve pass record.'}</p>
        <div className="pt-2">
          <Link
            to="/visitor"
            className="text-2xs font-mono text-zinc-900 hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>RETURN TO VISITOR KIOSK</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-4">
      <div>
        <Link
          to="/visitor"
          className="inline-flex items-center gap-1.5 text-2xs font-mono text-zinc-600 hover:text-zinc-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO VISITOR KIOSK</span>
        </Link>
      </div>

      {/* High-Assurance Digital Pass Card */}
      <div className="card overflow-hidden shadow-2xl relative">
        
        {/* Pass Top Bar */}
        <div className="bg-base px-5 py-3.5 border-b border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-zinc-900" />
            <div>
              <div className="font-mono text-xs font-bold text-zinc-900 tracking-wider">
                HOSTGUARD PASS
              </div>
              <div className="text-[9px] font-mono text-zinc-500">LNMIIT GATE CLEARANCE</div>
            </div>
          </div>
          <StatusBadge status={request.requestStatus} />
        </div>

        {/* QR Core Container */}
        <div className="p-6 bg-zinc-50 flex flex-col items-center justify-center border-b border-zinc-200 relative">
          
          {/* Subtle Security Crosshairs */}
          <div className="absolute top-3 left-3 w-3 h-3 border-t border-l border-zinc-300" />
          <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-zinc-300" />
          <div className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-zinc-300" />
          <div className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-zinc-300" />

          {request.requestStatus === 'APPROVED' && qrPass?.qrCodeDataUrl ? (
            <div className="flex flex-col items-center space-y-3">
              <div className="bg-white p-3.5 rounded shadow-2xl">
                <img
                  src={qrPass.qrCodeDataUrl}
                  alt="Dynamic Gate QR Pass"
                  className="w-48 h-48 object-contain"
                />
              </div>
              <div className="text-center">
                <span className="font-mono text-xs font-bold text-zinc-900 tracking-widest block">
                  {qrPass.token}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  SINGLE ENTRY AUTHORIZATION (BR-008)
                </span>
              </div>
            </div>
          ) : request.requestStatus === 'PENDING' ? (
            <div className="p-8 text-center space-y-3">
              <Clock className="w-10 h-10 text-status-amber mx-auto animate-pulse-subtle" />
              <div className="text-xs font-mono font-bold text-zinc-900 uppercase">
                AWAITING HOST CLEARANCE
              </div>
              <p className="text-2xs font-mono text-zinc-600 max-w-xs">
                Host student ({request.hostStudentRollNumber}) must approve this request before gate pass activates.
              </p>
            </div>
          ) : (
            <div className="p-8 text-center text-2xs font-mono text-zinc-500">
              PASS INACTIVE ({request.requestStatus})
            </div>
          )}
        </div>

        {/* Pass Key-Value Dossier */}
        <div className="p-5 space-y-2.5 text-2xs font-mono">
          <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
            <span className="text-zinc-500 uppercase">PRIMARY VISITOR</span>
            <span className="text-zinc-900 font-bold">
              {request.visitor.fullName} ({request.totalVisitorCount} Ppl)
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
            <span className="text-zinc-500 uppercase">GOVT ID RECORD</span>
            <span className="text-zinc-700">
              {request.visitor.identificationType}: {request.visitor.identificationNumber}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
            <span className="text-zinc-500 uppercase">HOST STUDENT</span>
            <span className="text-blue-600 font-bold">{request.hostStudentRollNumber}</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
            <span className="text-zinc-500 uppercase">DESTINATION</span>
            <span className="text-zinc-800">{request.hostelId} · Room {request.roomNumber}</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
            <span className="text-zinc-500 uppercase">SCHEDULE WINDOW</span>
            <span className="text-zinc-800">
              {new Date(request.expectedEntryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(request.expectedExitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Security Notice */}
          <div className="p-3 rounded bg-base border border-zinc-200 text-zinc-600 text-2xs flex items-start gap-2 mt-3">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-zinc-900" />
            <span>
              <strong>Gate Security Protocol:</strong> Present physical Government ID matching registered credentials to the guard upon entry.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
