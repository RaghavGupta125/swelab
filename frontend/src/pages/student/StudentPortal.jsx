import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import {
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  AlertCircle,
  Phone,
  QrCode,
  RefreshCw,
  ExternalLink,
  X,
  Check,
  Calendar,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const CountdownTimer = ({ createdAt }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculate = () => {
      const created = new Date(createdAt).getTime();
      const expires = created + 20 * 60 * 1000; // BR-006: 20 minutes
      const diff = Math.max(0, Math.floor((expires - Date.now()) / 1000));
      setTimeLeft(diff);
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [createdAt]);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isUrgent = timeLeft < 300; // < 5 mins

  return (
    <span
      className={`font-mono text-2xs px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
        isUrgent
          ? 'bg-status-redBg text-status-red border-status-redBorder animate-pulse-subtle'
          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
      }`}
    >
      <Clock className="w-3 h-3" />
      <span>
        {timeLeft > 0 ? `${mins}:${secs < 10 ? '0' : ''}${secs} REMAINING` : 'EXPIRED'}
      </span>
    </span>
  );
};

export const StudentPortal = () => {
  const { user } = useAuth();
  const rollNumber = user?.profile?.rollNumber || '';
  const hostelId = user?.profile?.hostelId || '';
  const roomNumber = user?.profile?.roomNumber || '';

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Rejection modal state
  const [rejectModalReq, setRejectModalReq] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Pre-registration modal state
  const [isPreRegisterOpen, setIsPreRegisterOpen] = useState(false);
  const [preRegLoading, setPreRegLoading] = useState(false);
  const [preRegForm, setPreRegForm] = useState({
    visitorName: '',
    visitorPhone: '',
    identificationType: 'Aadhaar Card',
    identificationNumber: '',
    purpose: 'Academic Discussion',
    visitDate: new Date().toISOString().split('T')[0],
    expectedEntryTimeStr: '16:00',
    expectedExitTimeStr: '18:00',
    accompanyingGuestName: '',
  });

  // History status filter
  const [historyFilter, setHistoryFilter] = useState('ALL');

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.getStudentDashboard();
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.warn('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    setActionMessage({ type: '', text: '' });
    try {
      await api.approveRequest(requestId);
      setActionMessage({
        type: 'success',
        text: `Request ${requestId} approved. QR Gate Pass issued to visitor.`,
      });
      loadDashboard();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to approve request.',
      });
    }
  };

  const handleRejectConfirm = async (e) => {
    e.preventDefault();
    if (!rejectModalReq) return;

    setRejecting(true);
    setActionMessage({ type: '', text: '' });

    try {
      await api.rejectRequest(rejectModalReq.requestId, rejectionReason);
      setActionMessage({
        type: 'success',
        text: `Request ${rejectModalReq.requestId} rejected.`,
      });
      setRejectModalReq(null);
      setRejectionReason('');
      loadDashboard();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to reject request.',
      });
    } finally {
      setRejecting(false);
    }
  };

  const handlePreRegisterSubmit = async (e) => {
    e.preventDefault();
    setPreRegLoading(true);
    setActionMessage({ type: '', text: '' });

    try {
      const payload = {
        ...preRegForm,
        hostStudentRollNumber: rollNumber,
        hostelId,
        roomNumber,
        accompanyingGuests: preRegForm.accompanyingGuestName
          ? [{ name: preRegForm.accompanyingGuestName }]
          : [],
      };

      const res = await api.createRequest(payload);
      setActionMessage({
        type: 'success',
        text: `Pre-registration created (ID: ${res.request.requestId}). You may now approve it below.`,
      });
      setIsPreRegisterOpen(false);
      setPreRegForm({
        visitorName: '',
        visitorPhone: '',
        identificationType: 'Aadhaar Card',
        identificationNumber: '',
        purpose: 'Academic Discussion',
        visitDate: new Date().toISOString().split('T')[0],
        expectedEntryTimeStr: '16:00',
        expectedExitTimeStr: '18:00',
        accompanyingGuestName: '',
      });
      loadDashboard();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Pre-registration failed.',
      });
    } finally {
      setPreRegLoading(false);
    }
  };

  const currentCount = dashboardData?.activeVisitorsCount || 0;
  const maxQuota = 5;

  const filteredHistory = (dashboardData?.history || []).filter((req) => {
    if (historyFilter === 'ALL') return true;
    return req.requestStatus === historyFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Student Host Status & Quota Bar */}
      <div className="bg-[#111115] border border-white/[0.08] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-base font-bold text-zinc-100 uppercase tracking-tight">
              HOST STUDENT WORKSPACE
            </h1>
            <span className="text-2xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              {rollNumber} · {hostelId} Room {roomNumber}
            </span>
          </div>
          <div className="text-2xs text-zinc-500 font-mono mt-1">
            ACADEMIC HOST CLEARANCE · CONCURRENT ENTRY LIMIT: 5 VISITORS (BR-001)
          </div>
        </div>

        {/* 5-Dot Quota Gauge */}
        <div className="flex items-center gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-2xs font-mono">
              <span className="text-zinc-400">ACTIVE QUOTA USAGE</span>
              <span className="text-zinc-200 font-bold">{currentCount} / {maxQuota}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[...Array(maxQuota)].map((_, i) => (
                <div
                  key={i}
                  className={`w-6 h-2 rounded-sm transition-colors ${
                    i < currentCount
                      ? 'bg-accent shadow-[0_0_6px_#E8531D]'
                      : 'bg-zinc-800 border border-white/[0.05]'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={() => setIsPreRegisterOpen(true)}
            className="px-3.5 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-mono font-semibold rounded inline-flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>PRE-REGISTER GUEST</span>
          </button>
        </div>
      </div>

      {/* Action Notification Strip */}
      {actionMessage.text && (
        <div
          className={`p-3 rounded border text-xs font-mono flex items-center justify-between gap-2 animate-fade-in ${
            actionMessage.type === 'error'
              ? 'bg-status-redBg border-status-redBorder text-status-red'
              : 'bg-status-greenBg border-status-greenBorder text-status-green'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage({ type: '', text: '' })}
            className="text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pending Clearance Requests */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400">
              PENDING CLEARANCE REQUESTS
            </span>
            <span className="text-2xs font-mono px-2 py-0.5 rounded-full bg-status-amberBg text-status-amber border border-status-amberBorder font-bold">
              {dashboardData?.pendingRequests?.length || 0} AWAITING DECISION
            </span>
          </div>
          <button
            onClick={loadDashboard}
            className="text-2xs font-mono text-zinc-500 hover:text-zinc-300 inline-flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin text-accent' : ''}`} />
            <span>REFRESH</span>
          </button>
        </div>

        {dashboardData?.pendingRequests?.length === 0 ? (
          <div className="bg-[#111115] border border-white/[0.06] rounded-lg p-8 text-center text-2xs font-mono text-zinc-600">
            NO PENDING REQUESTS AWAITING CLEARANCE
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData?.pendingRequests?.map((req) => (
              <div
                key={req.requestId}
                className="bg-[#111115] border border-white/[0.08] hover:border-white/[0.15] rounded-lg p-5 flex flex-col justify-between space-y-4 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/[0.06]">
                    <div>
                      <div className="text-2xs font-mono text-zinc-500">ID: {req.requestId}</div>
                      <h3 className="text-sm font-bold text-zinc-100 mt-0.5">{req.visitor.fullName}</h3>
                      <div className="text-2xs font-mono text-zinc-400">{req.visitor.phoneNumber}</div>
                    </div>
                    <CountdownTimer createdAt={req.createdAt} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-2xs font-mono">
                    <div className="p-2 rounded bg-base border border-white/[0.04]">
                      <span className="text-zinc-500">PURPOSE</span>
                      <div className="text-zinc-200 truncate mt-0.5">{req.purpose}</div>
                    </div>
                    <div className="p-2 rounded bg-base border border-white/[0.04]">
                      <span className="text-zinc-500">SCHEDULE</span>
                      <div className="text-zinc-200 truncate mt-0.5">
                        {new Date(req.expectedEntryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(req.expectedExitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {req.accompanyingGuests?.length > 0 && (
                    <div className="mt-2 p-2 rounded bg-base border border-white/[0.04] text-2xs font-mono">
                      <span className="text-zinc-500">ACCOMPANYING GUESTS (+{req.accompanyingGuests.length}): </span>
                      <span className="text-zinc-300">
                        {req.accompanyingGuests.map((g) => g.fullName).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/[0.06] flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRejectModalReq(req);
                      setRejectionReason('');
                    }}
                    className="flex-1 py-2 bg-[#252529] hover:bg-status-red hover:text-white text-zinc-300 text-xs font-mono font-semibold rounded border border-white/[0.08] transition-colors"
                  >
                    REJECT
                  </button>
                  <button
                    onClick={() => handleApprove(req.requestId)}
                    className="flex-1 py-2 bg-status-green hover:bg-green-600 text-black text-xs font-mono font-bold rounded transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>APPROVE & ISSUE PASS</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active & Approved Passes */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400">
            APPROVED PASSES & ACTIVE VISITORS
          </span>
          <span className="text-2xs font-mono text-zinc-600">SINGLE-ENTRY PASSES</span>
        </div>

        {dashboardData?.approvedRequests?.length === 0 ? (
          <div className="bg-[#111115] border border-white/[0.06] rounded-lg p-6 text-center text-2xs font-mono text-zinc-600">
            NO ACTIVE OR APPROVED PASSES SCHEDULED
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {dashboardData?.approvedRequests?.map((req) => (
              <div
                key={req.requestId}
                className="bg-[#111115] border border-white/[0.08] rounded-lg p-4 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="text-2xs font-mono text-zinc-500">{req.requestId}</span>
                    <StatusBadge status={req.requestStatus} />
                  </div>
                  <div className="text-xs font-bold text-zinc-100">{req.visitor.fullName}</div>
                  <div className="text-2xs font-mono text-zinc-400 mt-0.5">
                    {req.visitor.phoneNumber} · {req.totalVisitorCount} total visitor(s)
                  </div>
                  <div className="text-2xs font-mono text-zinc-500 mt-2">
                    Window: {new Date(req.expectedEntryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(req.expectedExitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <Link
                  to={`/pass/${req.requestId}`}
                  className="py-1.5 rounded bg-base hover:bg-white/[0.05] border border-white/[0.07] text-2xs font-mono text-blue-400 hover:text-blue-300 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>VIEW DIGITAL QR PASS &rarr;</span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historical Log */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400">
            VISIT RECORD ARCHIVE
          </span>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'APPROVED', 'REJECTED', 'EXPIRED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setHistoryFilter(st)}
                className={`px-2.5 py-1 rounded text-2xs font-mono font-semibold uppercase tracking-wider transition-colors ${
                  historyFilter === st
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'text-zinc-500 hover:text-zinc-300 bg-base border border-white/[0.05]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#111115] border border-white/[0.08] rounded-lg overflow-x-auto">
          <table className="w-full text-left text-2xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-zinc-500 bg-base">
                <th className="p-3">REQUEST ID</th>
                <th className="p-3">VISITOR</th>
                <th className="p-3">PURPOSE</th>
                <th className="p-3">DATE / SCHEDULE</th>
                <th className="p-3">GUESTS</th>
                <th className="p-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-600">
                    NO VISIT RECORDS MATCHING FILTER
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.requestId} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 text-zinc-400 font-bold">{item.requestId}</td>
                    <td className="p-3">
                      <div className="text-zinc-200 font-medium">{item.visitor.fullName}</div>
                      <div className="text-zinc-500 text-[10px]">{item.visitor.phoneNumber}</div>
                    </td>
                    <td className="p-3 text-zinc-400 truncate max-w-[160px]">{item.purpose}</td>
                    <td className="p-3 text-zinc-400">
                      <div>{new Date(item.visitDate).toLocaleDateString()}</div>
                      <div className="text-zinc-500 text-[10px]">
                        {new Date(item.expectedEntryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-3 text-zinc-400">
                      {item.accompanyingGuests?.length > 0 ? `+${item.accompanyingGuests.length}` : '—'}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={item.requestStatus} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pre-Registration Studio Modal */}
      {isPreRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-[#111115] border border-white/10 rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-base">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-200">
                PRE-REGISTER VISITOR CLEARANCE
              </span>
              <button
                onClick={() => setIsPreRegisterOpen(false)}
                className="text-zinc-500 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePreRegisterSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">VISITOR FULL NAME</label>
                  <input
                    type="text"
                    required
                    value={preRegForm.visitorName}
                    onChange={(e) => setPreRegForm({ ...preRegForm, visitorName: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="form-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="form-label">PHONE NUMBER</label>
                  <input
                    type="tel"
                    required
                    value={preRegForm.visitorPhone}
                    onChange={(e) => setPreRegForm({ ...preRegForm, visitorPhone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="form-input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">GOVT ID TYPE</label>
                  <select
                    value={preRegForm.identificationType}
                    onChange={(e) => setPreRegForm({ ...preRegForm, identificationType: e.target.value })}
                    className="form-input text-xs font-mono"
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="College ID">College ID</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">GOVT ID NUMBER</label>
                  <input
                    type="text"
                    required
                    value={preRegForm.identificationNumber}
                    onChange={(e) => setPreRegForm({ ...preRegForm, identificationNumber: e.target.value })}
                    placeholder="e.g. XXXX-XXXX-1234"
                    className="form-input text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">PURPOSE OF VISIT</label>
                <input
                  type="text"
                  required
                  value={preRegForm.purpose}
                  onChange={(e) => setPreRegForm({ ...preRegForm, purpose: e.target.value })}
                  placeholder="e.g. Academic Discussion / Project Review"
                  className="form-input text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="form-label">DATE</label>
                  <input
                    type="date"
                    required
                    value={preRegForm.visitDate}
                    onChange={(e) => setPreRegForm({ ...preRegForm, visitDate: e.target.value })}
                    className="form-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="form-label">EXPECTED IN</label>
                  <input
                    type="time"
                    required
                    value={preRegForm.expectedEntryTimeStr}
                    onChange={(e) => setPreRegForm({ ...preRegForm, expectedEntryTimeStr: e.target.value })}
                    className="form-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="form-label">EXPECTED OUT</label>
                  <input
                    type="time"
                    required
                    value={preRegForm.expectedExitTimeStr}
                    onChange={(e) => setPreRegForm({ ...preRegForm, expectedExitTimeStr: e.target.value })}
                    className="form-input text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">ACCOMPANYING GUEST (OPTIONAL)</label>
                <input
                  type="text"
                  value={preRegForm.accompanyingGuestName}
                  onChange={(e) => setPreRegForm({ ...preRegForm, accompanyingGuestName: e.target.value })}
                  placeholder="e.g. Radhika Sharma"
                  className="form-input text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsPreRegisterOpen(false)}
                  className="px-4 py-2 bg-[#252529] hover:bg-[#303036] text-zinc-300 rounded text-xs font-mono font-semibold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={preRegLoading}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded text-xs font-mono font-semibold transition-colors disabled:opacity-50"
                >
                  {preRegLoading ? 'SUBMITTING...' : 'CREATE PRE-REGISTRATION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Reason Studio Modal */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#111115] border border-white/10 rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-base">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-200">
                REJECT REQUEST {rejectModalReq.requestId}
              </span>
              <button
                onClick={() => setRejectModalReq(null)}
                className="text-zinc-500 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRejectConfirm} className="p-5 space-y-4">
              <p className="text-2xs font-mono text-zinc-400">
                Visitor: <strong className="text-zinc-200">{rejectModalReq.visitor.fullName}</strong>. Provide an optional reason for the rejection (BR-003).
              </p>

              <div>
                <label className="form-label">REJECTION REASON (OPTIONAL)</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Unavailable in hostel during scheduled hours / Lab test ongoing"
                  className="form-input text-xs font-mono resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setRejectModalReq(null)}
                  className="px-4 py-2 bg-[#252529] hover:bg-[#303036] text-zinc-300 rounded text-xs font-mono font-semibold"
                >
                  ABORT
                </button>
                <button
                  type="submit"
                  disabled={rejecting}
                  className="px-4 py-2 bg-status-red hover:bg-red-600 text-white rounded text-xs font-mono font-semibold transition-colors disabled:opacity-50"
                >
                  {rejecting ? 'REJECTING...' : 'CONFIRM REJECTION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
