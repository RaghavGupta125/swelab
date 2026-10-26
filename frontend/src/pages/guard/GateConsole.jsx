import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { QRScannerModal } from '../../components/QRScannerModal.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import {
  Camera,
  Search,
  CheckCircle2,
  LogOut,
  LogIn,
  AlertCircle,
  Shield,
  Clock,
  Users,
  Briefcase,
  RefreshCw,
  Phone,
  Home,
  Check,
  X,
  User,
  ArrowRight,
} from 'lucide-react';

export const GateConsole = () => {
  const { user } = useAuth();
  const guardHostel = user?.profile?.assignedHostelId || 'BH1';
  const guardId = user?.profile?.guardId || 'G012';

  // Shift Attendance State (BR-011)
  const [shiftActive, setShiftActive] = useState(false);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [attendanceRecord, setAttendanceRecord] = useState(null);

  // Scanner modal state
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Search input & verified pass
  const [searchQuery, setSearchQuery] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifiedPassData, setVerifiedPassData] = useState(null);
  const [gateActionStatus, setGateActionStatus] = useState({ type: '', message: '' });

  // Active Inside Visitors & Workers
  const [activeTab, setActiveTab] = useState('VISITORS'); // 'VISITORS' | 'WORKERS'
  const [activeInsideVisitors, setActiveInsideVisitors] = useState([]);
  const [workersList, setWorkersList] = useState([]);
  const [loadingActive, setLoadingActive] = useState(false);

  useEffect(() => {
    loadShiftStatus();
    loadActiveVisitors();
    loadWorkers();
    const interval = setInterval(loadActiveVisitors, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadShiftStatus = async () => {
    try {
      const res = await api.getGuardShiftStatus();
      if (res.success) {
        setShiftActive(res.isActive);
        setAttendanceRecord(res.shift);
      }
    } catch (err) {
      console.warn('Failed to load guard shift status:', err);
    }
  };

  const loadActiveVisitors = async () => {
    setLoadingActive(true);
    try {
      const res = await api.getActiveInsideVisitors(guardHostel);
      if (res.success) {
        setActiveInsideVisitors(res.activeVisitors || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingActive(false);
    }
  };

  const loadWorkers = async () => {
    try {
      const res = await api.getWorkers(guardHostel);
      if (res.success) {
        setWorkersList(res.workers || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleShift = async () => {
    setShiftLoading(true);
    setGateActionStatus({ type: '', message: '' });
    try {
      if (shiftActive) {
        const res = await api.checkOutShift();
        setShiftActive(false);
        setAttendanceRecord(res.attendance);
        setGateActionStatus({ type: 'success', message: 'Duty shift logged out. Gate clearance locked.' });
      } else {
        const res = await api.checkInShift(guardHostel);
        setShiftActive(true);
        setAttendanceRecord(res.attendance);
        setGateActionStatus({ type: 'success', message: 'Shift logged in. Gate operational clearance active.' });
      }
    } catch (err) {
      setGateActionStatus({ type: 'error', message: err.message || 'Failed to toggle duty shift.' });
    } finally {
      setShiftLoading(false);
    }
  };

  const handleVerifyPass = async (queryInput) => {
    const query = (queryInput || searchQuery).trim();
    if (!query) return;

    setVerifying(true);
    setGateActionStatus({ type: '', message: '' });
    setVerifiedPassData(null);

    try {
      const params = {};
      if (query.startsWith('TKN-') || query.startsWith('HGQR')) {
        params.token = query;
      } else if (query.startsWith('VR')) {
        params.requestId = query;
      } else if (/^\d{10}$/.test(query) || query.startsWith('+')) {
        params.phone = query;
      } else {
        params.rollNumber = query;
      }

      const res = await api.verifyGatePass(params);
      if (res.success && res.data) {
        setVerifiedPassData(res.data);
        if (!res.data.isValid) {
          setGateActionStatus({ type: 'error', message: res.data.reason });
        }
      }
    } catch (err) {
      setGateActionStatus({ type: 'error', message: err.message || 'Pass verification query failed.' });
    } finally {
      setVerifying(false);
    }
  };

  const handleCheckIn = async () => {
    if (!verifiedPassData?.visitRequest) return;
    setGateActionStatus({ type: '', message: '' });

    try {
      const res = await api.recordGateCheckIn({
        requestId: verifiedPassData.visitRequest.requestId,
        passToken: verifiedPassData.qrPass?.token,
        hostelId: guardHostel,
      });

      setGateActionStatus({
        type: 'success',
        message: `CLEARED ENTRY: ${res.visitRecord.visitorName} admitted into ${guardHostel}.`,
      });

      setVerifiedPassData(null);
      setSearchQuery('');
      loadActiveVisitors();
    } catch (err) {
      setGateActionStatus({ type: 'error', message: err.message || 'Check-In operation rejected.' });
    }
  };

  const handleCheckOut = async (visitRecord) => {
    setGateActionStatus({ type: '', message: '' });

    try {
      const res = await api.recordGateCheckOut({
        visitId: visitRecord.visitId,
        requestId: visitRecord.requestId,
      });

      const isOverstay = res.visitRecord.overstayStatus;
      setGateActionStatus({
        type: isOverstay ? 'warning' : 'success',
        message: `EXIT LOGGED: ${res.visitRecord.visitorName} departed.${
          isOverstay ? ' (OVERSTAY VIOLATION INCIDENT RECORDED)' : ''
        }`,
      });

      setVerifiedPassData(null);
      loadActiveVisitors();
    } catch (err) {
      setGateActionStatus({ type: 'error', message: err.message || 'Check-Out operation failed.' });
    }
  };

  const handleWorkerActivity = async (workerId, action) => {
    setGateActionStatus({ type: '', message: '' });
    try {
      const res = await api.logWorkerActivity({
        workerId,
        action,
      });
      setGateActionStatus({ type: 'success', message: res.data.message });
      loadWorkers();
    } catch (err) {
      setGateActionStatus({ type: 'error', message: err.message || 'Worker gate operation failed.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Security Terminal Ops Bar */}
      <div className="bg-[#111115] border border-white/[0.08] rounded-lg p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div
              className={`w-3 h-3 rounded-full ${
                shiftActive ? 'bg-status-green animate-led-blink shadow-[0_0_8px_#22C55E]' : 'bg-status-red shadow-[0_0_8px_#EF4444]'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-sm font-bold text-zinc-100 uppercase tracking-tight">
                GATE CONTROL STATION · {guardHostel}
              </h1>
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                  shiftActive
                    ? 'text-status-green bg-status-greenBg border-status-greenBorder'
                    : 'text-status-red bg-status-redBg border-status-redBorder'
                }`}
              >
                {shiftActive ? 'DUTY ACTIVE' : 'LOCKED / OFF DUTY'}
              </span>
            </div>
            <div className="text-2xs font-mono text-zinc-400 mt-0.5">
              OFFICER: <span className="text-zinc-200">{user?.name}</span> ({guardId})
              {attendanceRecord?.checkInTime && shiftActive && (
                <span className="text-zinc-500 ml-2">
                  CLOCK-IN: {new Date(attendanceRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          <button
            onClick={handleToggleShift}
            disabled={shiftLoading}
            className={`px-3.5 py-1.5 text-xs font-mono font-semibold rounded transition-colors inline-flex items-center gap-1.5 ${
              shiftActive
                ? 'bg-[#252529] hover:bg-status-red/20 text-zinc-300 hover:text-status-red border border-white/[0.08]'
                : 'bg-status-green hover:bg-green-600 text-black font-bold'
            }`}
          >
            {shiftLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : shiftActive ? (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span>END SHIFT</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>CLOCK IN SHIFT</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Action Notification Strip */}
      {gateActionStatus.message && (
        <div
          className={`p-3 rounded border text-xs font-mono flex items-center justify-between gap-2 animate-fade-in ${
            gateActionStatus.type === 'error'
              ? 'bg-status-redBg border-status-redBorder text-status-red'
              : gateActionStatus.type === 'warning'
              ? 'bg-status-amberBg border-status-amberBorder text-status-amber'
              : 'bg-status-greenBg border-status-greenBorder text-status-green'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{gateActionStatus.message}</span>
          </div>
          <button
            onClick={() => setGateActionStatus({ type: '', message: '' })}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main 3-Column Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Column 1: Optical Scan & Lookup Controls (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#111115] border border-white/[0.08] rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400">
                VERIFICATION TRIGGER
              </span>
              <span className="text-2xs font-mono text-zinc-600">FR-029</span>
            </div>

            {/* Big Optical Scanner Button */}
            <button
              onClick={() => setIsScannerOpen(true)}
              disabled={!shiftActive}
              className="w-full py-4 bg-accent hover:bg-accent-hover text-white rounded-md font-mono font-semibold text-xs flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:hover:bg-accent shadow-lg shadow-accent/10"
            >
              <div className="p-2 rounded bg-white/10">
                <Camera className="w-6 h-6" />
              </div>
              <span className="tracking-wider uppercase">LAUNCH OPTICAL QR SCANNER</span>
              <span className="text-[10px] text-white/70 font-normal">Fast-Path Gate Lens</span>
            </button>

            {/* Manual Lookup Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyPass();
              }}
              className="pt-2 space-y-3"
            >
              <div>
                <label className="form-label">MANUAL LOOKUP (TOKEN / ROLL / VR ID)</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    disabled={!shiftActive}
                    placeholder="e.g. TKN-A45X9 or VR2045"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input pl-9 font-mono text-xs disabled:opacity-40"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={!shiftActive || verifying || !searchQuery.trim()}
                className="w-full py-2 bg-[#252529] hover:bg-[#323238] text-zinc-200 text-xs font-mono font-semibold rounded border border-white/[0.08] flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
              >
                {verifying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>VERIFYING CRYPTO PASS...</span>
                  </>
                ) : (
                  <>
                    <span>EXECUTE PASS LOOKUP</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {!shiftActive && (
              <div className="p-2.5 rounded bg-status-amberBg border border-status-amberBorder text-status-amber text-2xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Duty clock-in required before gate verification operations (BR-011).</span>
              </div>
            )}
          </div>

          {/* Quick Gate Guidelines */}
          <div className="bg-[#111115] border border-white/[0.06] rounded-lg p-4 space-y-2">
            <span className="text-2xs font-mono uppercase tracking-wider text-zinc-500">
              GATE PROTOCOL RULES
            </span>
            <ul className="text-2xs text-zinc-400 space-y-1.5 list-disc list-inside font-mono">
              <li>Visiting Window: 08:00 - 19:00 IST (BR-005)</li>
              <li>Single Entry: Pass invalidates after use (BR-008)</li>
              <li>Host Quota: Max 5 concurrent guests (BR-001)</li>
              <li>Inspect physical government ID at gate</li>
            </ul>
          </div>
        </div>

        {/* Column 2: Clearance Dossier Card (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-[#111115] border border-white/[0.08] rounded-lg p-5 flex flex-col justify-between min-h-[420px]">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-4">
                <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400">
                  CLEARANCE DOSSIER
                </span>
                {verifiedPassData && (
                  <StatusBadge
                    status={verifiedPassData.isValid ? 'CLEARED' : 'DENIED'}
                  />
                )}
              </div>

              {!verifiedPassData ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-base border border-white/[0.08] flex items-center justify-center mx-auto text-zinc-600">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-mono text-zinc-400">WAITING FOR PASS SCAN</div>
                  <p className="text-2xs text-zinc-600 max-w-xs mx-auto">
                    Scan visitor QR code or enter pass token manually to inspect credentials and authorization.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Visitor Profile Strip */}
                  <div className="flex items-start gap-3 p-3 bg-base border border-white/[0.06] rounded">
                    <div className="w-10 h-10 rounded bg-accent/15 border border-accent/30 text-accent font-mono font-bold text-sm flex items-center justify-center shrink-0">
                      {verifiedPassData.visitRequest.visitor.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-zinc-100 truncate">
                        {verifiedPassData.visitRequest.visitor.fullName}
                      </div>
                      <div className="text-2xs font-mono text-zinc-400">
                        {verifiedPassData.visitRequest.visitor.phoneNumber}
                      </div>
                      <div className="text-2xs font-mono text-zinc-500 truncate mt-0.5">
                        {verifiedPassData.visitRequest.visitor.identificationType}: {verifiedPassData.visitRequest.visitor.identificationNumber}
                      </div>
                    </div>
                  </div>

                  {/* Key Clearance Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 text-2xs font-mono">
                    <div className="p-2.5 rounded bg-base border border-white/[0.05]">
                      <div className="text-zinc-500">REQUEST ID</div>
                      <div className="text-zinc-200 font-bold mt-0.5">
                        {verifiedPassData.visitRequest.requestId}
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-base border border-white/[0.05]">
                      <div className="text-zinc-500">HOSTEL DESTINATION</div>
                      <div className="text-zinc-200 font-bold mt-0.5">
                        {verifiedPassData.visitRequest.hostelId} · Room {verifiedPassData.visitRequest.roomNumber}
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-base border border-white/[0.05]">
                      <div className="text-zinc-500">HOST STUDENT</div>
                      <div className="text-blue-400 font-bold mt-0.5">
                        {verifiedPassData.visitRequest.hostStudentRollNumber}
                      </div>
                    </div>
                    <div className="p-2.5 rounded bg-base border border-white/[0.05]">
                      <div className="text-zinc-500">ACCOMPANYING GUESTS</div>
                      <div className="text-zinc-200 font-bold mt-0.5">
                        +{verifiedPassData.visitRequest.accompanyingGuests?.length || 0} (Total {verifiedPassData.visitRequest.totalVisitorCount})
                      </div>
                    </div>
                  </div>

                  {/* Accompanying Guests List if any */}
                  {verifiedPassData.visitRequest.accompanyingGuests?.length > 0 && (
                    <div className="p-2.5 rounded bg-base border border-white/[0.05]">
                      <div className="text-2xs font-mono text-zinc-500 mb-1">GUEST LIST:</div>
                      <div className="flex flex-wrap gap-1">
                        {verifiedPassData.visitRequest.accompanyingGuests.map((g, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono text-2xs"
                          >
                            {g.fullName}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Schedule Window */}
                  <div className="p-2.5 rounded bg-base border border-white/[0.05] text-2xs font-mono flex items-center justify-between">
                    <span className="text-zinc-500">SCHEDULE WINDOW</span>
                    <span className="text-zinc-300 font-bold">
                      {new Date(verifiedPassData.visitRequest.expectedEntryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(verifiedPassData.visitRequest.expectedExitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {!verifiedPassData.isValid && (
                    <div className="p-3 rounded bg-status-redBg border border-status-redBorder text-status-red text-2xs font-mono">
                      DENIAL REASON: {verifiedPassData.reason}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Clearance Decision Buttons */}
            {verifiedPassData && (
              <div className="pt-4 border-t border-white/[0.06] mt-4 flex gap-2">
                <button
                  onClick={() => setVerifiedPassData(null)}
                  className="flex-1 py-2 bg-[#252529] hover:bg-[#303036] text-zinc-300 text-xs font-mono font-semibold rounded border border-white/[0.08] transition-colors"
                >
                  DISMISS
                </button>
                <button
                  onClick={handleCheckIn}
                  disabled={!shiftActive || !verifiedPassData.isValid}
                  className="flex-1 py-2 bg-status-green hover:bg-green-600 text-black text-xs font-mono font-bold rounded transition-colors disabled:opacity-40 disabled:hover:bg-status-green flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>AUTHORIZE ENTRY</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Real-Time Active Log (Visitors & Workers) (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#111115] border border-white/[0.08] rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] mb-3">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab('VISITORS')}
                  className={`px-2.5 py-1 rounded text-2xs font-mono font-semibold uppercase tracking-wider transition-colors ${
                    activeTab === 'VISITORS'
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Inside Visitors ({activeInsideVisitors.length})
                </button>
                <button
                  onClick={() => setActiveTab('WORKERS')}
                  className={`px-2.5 py-1 rounded text-2xs font-mono font-semibold uppercase tracking-wider transition-colors ${
                    activeTab === 'WORKERS'
                      ? 'bg-accent/15 text-accent border border-accent/30'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Staff ({workersList.filter(w => w.currentlyInside).length} Inside)
                </button>
              </div>

              <button
                onClick={() => {
                  loadActiveVisitors();
                  loadWorkers();
                }}
                className="text-zinc-500 hover:text-zinc-200 p-1"
                title="Refresh log"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingActive ? 'animate-spin text-accent' : ''}`} />
              </button>
            </div>

            {/* Content: Active Visitors */}
            {activeTab === 'VISITORS' && (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {activeInsideVisitors.length === 0 ? (
                  <div className="py-12 text-center text-2xs font-mono text-zinc-600">
                    NO ACTIVE VISITORS INSIDE HOSTEL
                  </div>
                ) : (
                  activeInsideVisitors.map((rec) => {
                    const isOverstay = rec.overstayStatus;
                    return (
                      <div
                        key={rec.visitId}
                        className={`p-3 rounded border bg-base transition-colors ${
                          isOverstay
                            ? 'border-status-redBorder bg-status-redBg/30'
                            : 'border-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                              <span>{rec.visitorName}</span>
                              {rec.totalVisitorCount > 1 && (
                                <span className="text-[10px] font-mono text-zinc-400">
                                  ({rec.totalVisitorCount} ppl)
                                </span>
                              )}
                            </div>
                            <div className="text-2xs font-mono text-zinc-400 mt-0.5">
                              Host: <span className="text-blue-400">{rec.hostStudentRollNumber}</span>
                            </div>
                            <div className="text-[10px] font-mono text-zinc-500 mt-1 flex items-center gap-2">
                              <span>In: {new Date(rec.actualEntryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isOverstay && (
                                <span className="text-status-red font-bold uppercase animate-pulse-subtle">
                                  OVERSTAY
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleCheckOut(rec)}
                            disabled={!shiftActive}
                            className="px-2.5 py-1.5 bg-[#252529] hover:bg-status-red hover:text-white text-zinc-300 text-2xs font-mono font-semibold rounded border border-white/[0.08] transition-colors shrink-0 disabled:opacity-40"
                          >
                            CHECK-OUT
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Content: Service Workers */}
            {activeTab === 'WORKERS' && (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {workersList.length === 0 ? (
                  <div className="py-12 text-center text-2xs font-mono text-zinc-600">
                    NO REGISTERED WORKERS
                  </div>
                ) : (
                  workersList.map((worker) => (
                    <div
                      key={worker.workerId}
                      className="p-3 rounded border border-white/[0.06] bg-base flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-bold text-zinc-100">
                          {worker.fullName}
                        </div>
                        <div className="text-2xs font-mono text-zinc-400">
                          {worker.department} · {worker.workerType}
                        </div>
                        <div className="text-[10px] font-mono mt-0.5">
                          <span
                            className={
                              worker.currentlyInside ? 'text-status-green' : 'text-zinc-600'
                            }
                          >
                            {worker.currentlyInside ? 'INSIDE HOSTEL' : 'OUTSIDE'}
                          </span>
                        </div>
                      </div>

                      <div>
                        {worker.currentlyInside ? (
                          <button
                            onClick={() => handleWorkerActivity(worker.workerId, 'EXIT')}
                            disabled={!shiftActive}
                            className="px-2.5 py-1.5 bg-[#252529] hover:bg-status-red hover:text-white text-zinc-300 text-2xs font-mono font-semibold rounded border border-white/[0.08] transition-colors disabled:opacity-40"
                          >
                            LOG EXIT
                          </button>
                        ) : (
                          <button
                            onClick={() => handleWorkerActivity(worker.workerId, 'ENTRY')}
                            disabled={!shiftActive}
                            className="px-2.5 py-1.5 bg-status-green hover:bg-green-600 text-black text-2xs font-mono font-bold rounded transition-colors disabled:opacity-40"
                          >
                            LOG ENTRY
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Optical Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(decodedToken) => {
          setSearchQuery(decodedToken);
          handleVerifyPass(decodedToken);
        }}
      />
    </div>
  );
};
