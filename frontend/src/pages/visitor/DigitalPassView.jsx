import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import {
  ShieldCheck,
  Calendar,
  Clock,
  Home,
  User,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Info
} from 'lucide-react';

export const DigitalPassView = () => {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [qrPass, setQrPass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPass();
    const interval = setInterval(loadPass, 20000);
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
      setError(err.message || 'Pass not found.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Pass Unavailable</h2>
        <p className="text-xs text-slate-400 mt-1 mb-4">{error || 'Could not retrieve pass details.'}</p>
        <Link to="/visitor" className="text-xs text-blue-400 hover:underline">
          Return to Visitor Kiosk
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <div className="mb-4">
        <Link
          to="/visitor"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Visitor Kiosk</span>
        </Link>
      </div>

      {/* Main Digital Pass Card */}
      <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Pass Top Banner */}
        <div className="bg-slate-850 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="font-mono text-xs font-bold text-white tracking-wider">HOSTGUARD DIGITAL PASS</div>
              <div className="text-[10px] text-slate-400">LNMIIT GATE ENTRY CLEARANCE</div>
            </div>
          </div>
          <StatusBadge status={request.requestStatus} />
        </div>

        {/* QR Code Container */}
        <div className="p-6 bg-slate-950 flex flex-col items-center justify-center border-b border-slate-800">
          {request.requestStatus === 'APPROVED' && qrPass?.qrCodeDataUrl ? (
            <div className="bg-white p-4 rounded-2xl shadow-xl flex flex-col items-center">
              <img
                src={qrPass.qrCodeDataUrl}
                alt="Dynamic Gate QR Pass"
                className="w-52 h-52 object-contain"
              />
              <span className="font-mono text-xs text-slate-900 font-bold mt-2 tracking-widest">
                {qrPass.token}
              </span>
            </div>
          ) : request.requestStatus === 'PENDING' ? (
            <div className="p-8 text-center space-y-2">
              <Clock className="w-12 h-12 text-amber-400 mx-auto animate-spin" style={{ animationDuration: '6s' }} />
              <div className="text-sm font-bold text-white">Awaiting Host Approval</div>
              <p className="text-xs text-slate-400">
                Your QR pass will appear here instantly once host student {request.hostStudentRollNumber} approves your request.
              </p>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              Pass is inactive ({request.requestStatus}).
            </div>
          )}

          {/* Quick manual verification token badge */}
          {qrPass?.token && (
            <div className="mt-3 text-[11px] font-mono text-slate-400 text-center">
              Token: <strong className="text-emerald-400 select-all">{qrPass.token}</strong> (Provide to guard if scanner is offline)
            </div>
          )}
        </div>

        {/* Visitor & Host Info */}
        <div className="p-5 space-y-3 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-mono uppercase text-[10px]">Primary Visitor</span>
            <span className="text-white font-bold">{request.visitor.fullName} ({request.totalVisitorCount} Person)</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-mono uppercase text-[10px]">Government ID</span>
            <span className="font-mono text-slate-200">{request.visitor.identificationType}: {request.visitor.identificationNumber}</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-mono uppercase text-[10px]">Host Student</span>
            <span className="font-mono text-blue-400 font-semibold">{request.hostStudentRollNumber}</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-mono uppercase text-[10px]">Destination</span>
            <span className="text-slate-200">{request.hostelId} · Room {request.roomNumber}</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400 font-mono uppercase text-[10px]">Schedule Window</span>
            <span className="text-slate-200">
              {new Date(request.expectedEntryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(request.expectedExitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Security Notice */}
          <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-800/60 text-blue-300 text-[11px] flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
            <div>
              <strong>Gate Verification Notice:</strong> Please present physical ID matching your registered credentials to the security guard upon arrival. Pass valid for single entry only (BR-008).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
