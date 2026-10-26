import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { QRScannerModal } from '../../components/QRScannerModal.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import {
  Camera,
  Search,
  CheckCircle,
  LogOut,
  LogIn,
  AlertTriangle,
  UserCheck,
  Shield,
  Clock,
  Users,
  Briefcase,
  RefreshCw,
  Phone,
  Home,
  Check,
  X
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

  // Load shift status and active visitors on mount
  useEffect(() => {
    loadShiftStatus();
    loadActiveVisitors();
    loadWorkers();
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
        setGateActionStatus({ type: 'success', message: 'Duty shift checked out. Gate operations locked.' });
      } else {
        const res = await api.checkInShift(guardHostel);
        setShiftActive(true);
        setAttendanceRecord(res.attendance);
        setGateActionStatus({ type: 'success', message: 'Shift checked in successfully. Gate duty active.' });
      }
    } catch (err) {
      setGateActionStatus({ type: 'error', message: err.message || 'Failed to toggle shift.' });
    } finally {
      setShiftLoading(false);
    }
  };

  // Perform pass verification via scanned token or search query (FR-029)
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
        // Assume roll number or general token
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
      setGateActionStatus({ type: 'error', message: err.message || 'Pass verification failed.' });
    } finally {
      setVerifying(false);
    }
  };

  // Check-In Visitor (FR-032)
  const handleCheckIn = async () => {
    if (!verifiedPassData?.visitRequest) return;
    setGateActionStatus({ type: '', message: '' });

    try {
      const res = await api.recordGateCheckIn({
        requestId: verifiedPassData.visitRequest.requestId,
        passToken: verifiedPassData.qrPass?.token,
        hostelId: guardHostel
      });

      setGateActionStatus({
        type: 'success',
        message: `CHECK-IN SUCCESS: ${res.visitRecord.visitorName} entered ${guardHostel}.`
      });

      setVerifiedPassData(null);
      setSearchQuery('');
      loadActiveVisitors();
    } catch (err) {
      setGateActionStatus({ type: 'error', message: err.message || 'Check-In failed.' });
    }
  };

  // Check-Out Visitor (FR-035)
  const handleCheckOut = async (visitRecord) => {
    setGateActionStatus({ type: '', message: '' });

    try {
      const res = await api.recordGateCheckOut({
        visitId: visitRecord.visitId,
        requestId: visitRecord.requestId
      });

      const isOverstay = res.visitRecord.overstayStatus;
      setGateActionStatus({
        type: isOverstay ? 'warning' : 'success',
        message: `CHECK-OUT SUCCESS: ${res.visitRecord.visitorName} left the hostel.${
          isOverstay ? ' (OVERSTAY VIOLATION LOGGED)' : ''
        }`
      });

      setVerifiedPassData(null);
      loadActiveVisitors();
    } catch (err) {
      setGateActionStatus({ type: 'error', message: err.message || 'Check-Out failed.' });
    }
  };

  // Worker Entry / Exit toggle (FR-047, FR-048)
  const handleWorkerActivity = async (workerId, action) => {
    setGateActionStatus({ type: '', message: '' });
    try {
      const res = await api.logWorkerActivity({
        workerId,
        action
      });
      setGateActionStatus({ type: 'success', message: res.data.message });
      loadWorkers();
    } catch (err) {
      setGateActionStatus({ type: 'error', message: err.message || 'Worker gate operation failed.' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Terminal Status Bar */}
      <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${shiftActive ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}`}>
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-base font-bold text-white tracking-wide">
                GATE CONTROL TERMINAL · {guardHostel}
              </h1>
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${shiftActive ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-600' : 'bg-red-900/60 text-red-300 border border-red-600'}`}>
                {shiftActive ? 'ON ACTIVE DUTY' : 'SHIFT OFF'}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Guard Officer: <span className="text-slate-200 font-medium">{user?.name}</span> ({guardId})
              {attendanceRecord?.checkInTime && shiftActive && (
                <span className="ml-2 font-mono text-slate-500">
                  (Clocked in: {new Date(attendanceRecord.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Shift Attendance Toggle (BR-011) */}
        <div>
          <button
            onClick={handleToggleShift}
            disabled={shiftLoading}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition flex items-center gap-2 shadow ${
              shiftActive
                ? 'bg-slate-850 hover:bg-red-950/80 text-red-400 border border-slate-700 hover:border-red-700'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'
            }`}
          >
            {shiftLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : shiftActive ? (
              <>
                <LogOut className="w-4 h-4" />
                <span>Clock Out Shift</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Clock In for Gate Duty</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Duty Off Warning Banner */}
      {!shiftActive && (
        <div className="mb-6 p-4 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <span>
              <strong>BR-011 Guard Active Shift Requirement:</strong> You must clock in for duty before gate check-ins or check-outs can be authorized.
            </span>
          </div>
          <button
            onClick={handleToggleShift}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold shrink-0"
          >
            Clock In Now
          </button>
        </div>
      )}

      {/* Action Notification Message */}
      {gateActionStatus.message && (
        <div
          className={`mb-6 p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 animate-fadeIn ${
            gateActionStatus.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
              : gateActionStatus.type === 'warning'
              ? 'bg-red-950/90 border border-red-700 text-red-200'
              : 'bg-red-950/80 border border-red-800 text-red-300'
          }`}
        >
          {gateActionStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{gateActionStatus.message}</span>
        </div>
      )}

      {/* Operational Grid: Scanner/Verification & Active Visitors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Rapid Scan & Search Deck (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Scan & Lookup Card */}
          <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl p-5 shadow-xl">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-400" />
              <span>Visitor Gate Clearance</span>
            </h2>

            {/* Big Action: Open Camera Scanner */}
            <button
              onClick={() => setIsScannerOpen(true)}
              disabled={!shiftActive}
              className="w-full py-4 mb-4 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-semibold text-sm tracking-wide shadow-lg shadow-blue-900/40 flex items-center justify-center gap-3 transition disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>Open Gate QR Camera Scanner</span>
            </button>

            {/* Manual Quick Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyPass();
              }}
              className="space-y-2"
            >
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Manual Visitor Search (Phone / Roll No / Pass ID)
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. TKN-A45X9, 24UCS049, or 9829233445"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={verifying || !searchQuery.trim()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold tracking-wide transition disabled:opacity-40"
                >
                  {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Lookup'}
                </button>
              </div>
            </form>
          </div>

          {/* Verification Result Card (When pass is looked up) */}
          {verifiedPassData && verifiedPassData.visitRequest && (
            <div className="bg-hg-slate-900 border border-blue-500/50 rounded-xl p-5 shadow-2xl animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono text-slate-400">REQUEST ID: {verifiedPassData.visitRequest.requestId}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {verifiedPassData.visitRequest.visitor.fullName}
                  </h3>
                </div>
                <StatusBadge status={verifiedPassData.visitRequest.requestStatus} />
              </div>

              {/* Visitor Details */}
              <div className="grid grid-cols-2 gap-3 py-3 text-xs border-b border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Phone Number</span>
                  <span className="font-mono text-slate-200">{verifiedPassData.visitRequest.visitor.phoneNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Government ID</span>
                  <span className="font-mono text-slate-200">
                    {verifiedPassData.visitRequest.visitor.identificationType}: {verifiedPassData.visitRequest.visitor.identificationNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Host Student Roll</span>
                  <span className="font-mono text-blue-400 font-semibold">{verifiedPassData.visitRequest.hostStudentRollNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Assigned Room</span>
                  <span className="text-slate-200">{verifiedPassData.visitRequest.hostelId} · Room {verifiedPassData.visitRequest.roomNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Total Persons</span>
                  <span className="text-slate-200 font-semibold">{verifiedPassData.visitRequest.totalVisitorCount} Person(s)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Purpose</span>
                  <span className="text-slate-200 truncate">{verifiedPassData.visitRequest.purpose}</span>
                </div>
              </div>

              {/* Accompanying Guests */}
              {verifiedPassData.visitRequest.accompanyingGuests?.length > 0 && (
                <div className="py-2.5 border-b border-slate-800">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase font-mono mb-1.5">
                    Accompanying Guests ({verifiedPassData.visitRequest.accompanyingGuests.length})
                  </div>
                  <div className="space-y-1">
                    {verifiedPassData.visitRequest.accompanyingGuests.map((g, idx) => (
                      <div key={idx} className="text-xs text-slate-300 flex items-center justify-between bg-slate-950 px-2 py-1 rounded">
                        <span>{g.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{g.identificationType || 'Guest'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gate Actions */}
              <div className="mt-4">
                {verifiedPassData.isCurrentlyInside ? (
                  <button
                    onClick={() => handleCheckOut(verifiedPassData.existingVisit)}
                    disabled={!shiftActive}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Confirm Visitor Gate Exit (Check-Out)</span>
                  </button>
                ) : verifiedPassData.hasAlreadyCompleted ? (
                  <div className="p-3 bg-slate-950 rounded text-center text-xs text-slate-400 border border-slate-800">
                    This visitor already checked out. Pass has been permanently consumed.
                  </div>
                ) : verifiedPassData.isValid ? (
                  <button
                    onClick={handleCheckIn}
                    disabled={!shiftActive}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm Physical ID & Authorize Check-In</span>
                  </button>
                ) : (
                  <div className="p-3 bg-red-950/60 rounded text-center text-xs text-red-300 border border-red-800">
                    {verifiedPassData.reason || 'Pass cannot be authorized.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Active Inside Records & Service Staff Deck (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl overflow-hidden shadow-xl">
            {/* Header with Tabs */}
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('VISITORS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'VISITORS'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Active Inside Visitors ({activeInsideVisitors.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('WORKERS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'WORKERS'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Hostel Workers ({workersList.length})</span>
                </button>
              </div>

              <button
                onClick={() => {
                  loadActiveVisitors();
                  loadWorkers();
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-md transition"
                title="Refresh logs"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Tab 1: Active Inside Visitors */}
            {activeTab === 'VISITORS' && (
              <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
                {loadingActive ? (
                  <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Loading active visitors...</span>
                  </div>
                ) : activeInsideVisitors.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <div className="text-xs font-medium text-slate-400">No active visitors currently inside {guardHostel}.</div>
                  </div>
                ) : (
                  activeInsideVisitors.map((visit) => {
                    const isOverdue = visit.overstayStatus || new Date().getTime() > new Date(visit.expectedExitTime).getTime();

                    return (
                      <div
                        key={visit.visitId}
                        className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                          isOverdue ? 'bg-red-950/20 hover:bg-red-950/30' : 'hover:bg-slate-850/50'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{visit.visitorName}</span>
                            <span className="text-[11px] font-mono text-slate-400">({visit.totalVisitorCount} Person)</span>
                            {isOverdue && <StatusBadge status="OVERSTAY" />}
                          </div>
                          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Home className="w-3 h-3 text-slate-500" />
                              <span>Host: <strong className="text-slate-300">{visit.hostStudentRollNumber}</strong></span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{visit.visitorPhone}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>Entry: {new Date(visit.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                          </div>
                        </div>

                        {/* Quick Check-Out button */}
                        <button
                          onClick={() => handleCheckOut(visit)}
                          disabled={!shiftActive}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-600 text-slate-200 hover:text-white border border-slate-700 hover:border-amber-500 text-xs font-semibold flex items-center justify-center gap-1.5 transition shrink-0 disabled:opacity-40"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Check Out</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Tab 2: Campus Maintenance & Daily Workers (FR-047, FR-048) */}
            {activeTab === 'WORKERS' && (
              <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
                {workersList.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">No staff registered for this hostel.</div>
                ) : (
                  workersList.map((worker) => (
                    <div
                      key={worker.workerId}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-850/50 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{worker.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {worker.workerType}
                          </span>
                          <span className="text-xs text-slate-400">· {worker.department}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                          <span className="font-mono text-[11px] text-blue-400">{worker.workerId}</span>
                          <span>Assigned: <strong>{worker.assignedHostelId}</strong></span>
                          <span>Status: {worker.currentlyInside ? (
                            <span className="text-emerald-400 font-semibold">Inside Hostel</span>
                          ) : (
                            <span className="text-slate-500">Outside</span>
                          )}</span>
                        </div>
                      </div>

                      {/* Log Entry / Exit */}
                      <div className="flex items-center gap-2">
                        {worker.currentlyInside ? (
                          <button
                            onClick={() => handleWorkerActivity(worker.workerId, 'EXIT')}
                            disabled={!shiftActive}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 transition disabled:opacity-40"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Log Exit</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleWorkerActivity(worker.workerId, 'ENTRY')}
                            disabled={!shiftActive}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1 transition shadow disabled:opacity-40"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Log Entry</span>
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

      {/* QR Scanner Camera Modal */}
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
