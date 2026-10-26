import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  PlusCircle,
  AlertCircle,
  UserCheck,
  ShieldCheck,
  Calendar,
  Home,
  Phone,
  QrCode,
  FileText,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
    accompanyingGuestName: ''
  });

  // History status filter
  const [historyFilter, setHistoryFilter] = useState('ALL');

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 15000); // 15s refresh for approvals
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
      const res = await api.approveRequest(requestId);
      setActionMessage({
        type: 'success',
        text: `Approved request ${requestId}! QR Pass issued to visitor.`
      });
      loadDashboard();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to approve request.'
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
        text: `Request ${rejectModalReq.requestId} rejected.`
      });
      setRejectModalReq(null);
      setRejectionReason('');
      loadDashboard();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Failed to reject request.'
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
          : []
      };

      const res = await api.createRequest(payload);
      setActionMessage({
        type: 'success',
        text: `Pre-registration submitted! Request ID: ${res.request.requestId}. You can now approve it below.`
      });
      setIsPreRegisterOpen(false);
      // Reset form
      setPreRegForm({
        visitorName: '',
        visitorPhone: '',
        identificationType: 'Aadhaar Card',
        identificationNumber: '',
        purpose: 'Academic Discussion',
        visitDate: new Date().toISOString().split('T')[0],
        expectedEntryTimeStr: '16:00',
        expectedExitTimeStr: '18:00',
        accompanyingGuestName: ''
      });
      loadDashboard();
    } catch (err) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Pre-registration failed.'
      });
    } finally {
      setPreRegLoading(false);
    }
  };

  // Remaining minutes calculator for BR-006 (20 minutes approval timeout)
  const getRemainingMinutes = (createdAt) => {
    const createdTime = new Date(createdAt).getTime();
    const expiryTime = createdTime + 20 * 60 * 1000;
    const diffMs = expiryTime - Date.now();
    const remainingMins = Math.max(0, Math.ceil(diffMs / (60 * 1000)));
    return remainingMins;
  };

  const activeCount = dashboardData?.activeVisitorCount || 0;
  const maxQuota = dashboardData?.maxQuota || 5;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Profile & Quota Card */}
      <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl p-5 mb-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-semibold">
              HOST STUDENT RESIDENCE
            </span>
            <span className="text-xs text-slate-400 font-mono">{rollNumber}</span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">{user?.name}</h1>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-slate-500" />
              <span>Assigned: <strong className="text-slate-200">{hostelId}</strong> · Room <strong className="text-slate-200">{roomNumber}</strong></span>
            </span>
          </div>
        </div>

        {/* BR-001 Host Concurrent Visitor Quota Bar */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 min-w-[260px]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              Active Visitor Quota (BR-001)
            </span>
            <span className={`font-mono font-bold ${activeCount >= 5 ? 'text-red-400' : 'text-emerald-400'}`}>
              {activeCount} / {maxQuota}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                activeCount >= 5 ? 'bg-red-500' : activeCount >= 4 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${(activeCount / maxQuota) * 100}%` }}
            ></div>
          </div>
          <div className="text-[10px] text-slate-500 mt-1.5 flex items-center justify-between">
            <span>Max 5 simultaneous guests</span>
            {activeCount >= 5 && <span className="text-red-400 font-semibold">Quota Full</span>}
          </div>
        </div>

        {/* Action Button: Pre-register Anticipated Visitor */}
        <div>
          <button
            onClick={() => setIsPreRegisterOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold tracking-wide transition shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Pre-Register Visitor</span>
          </button>
        </div>
      </div>

      {/* Action Status Feedback */}
      {actionMessage.text && (
        <div
          className={`mb-6 p-4 rounded-xl text-xs font-medium flex items-center gap-2.5 animate-fadeIn ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
              : 'bg-red-950/80 border border-red-800 text-red-300'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Main Grid: Pending Approvals & History */}
      <div className="space-y-6">
        {/* Section 1: Pending Approvals Feed (FR-020, UC-006) */}
        <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="font-bold text-white text-sm">
                Incoming Visitor Requests Awaiting Your Approval ({dashboardData?.pendingRequests?.length || 0})
              </h2>
            </div>
            <button
              onClick={loadDashboard}
              className="p-1.5 text-slate-400 hover:text-white rounded-md transition"
              title="Refresh requests"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                <span>Loading requests...</span>
              </div>
            ) : dashboardData?.pendingRequests?.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <div className="text-xs font-medium text-slate-400">All caught up! No visitor requests pending your approval.</div>
              </div>
            ) : (
              dashboardData.pendingRequests.map((req) => {
                const remainingMinutes = getRemainingMinutes(req.createdAt);
                const isUrgent = remainingMinutes <= 5;

                return (
                  <div key={req.requestId} className="p-5 hover:bg-slate-850/40 transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Request details */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] text-blue-400 font-semibold">{req.requestId}</span>
                          <span className="font-bold text-white text-base">{req.visitor.fullName}</span>
                          <StatusBadge status="PENDING" />
                          <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
                            isUrgent ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse' : 'bg-slate-800 text-slate-300'
                          }`}>
                            <Clock className="w-3 h-3" />
                            {remainingMinutes > 0 ? `Expires in ${remainingMinutes}m` : 'Expired'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-400 pt-1">
                          <div>
                            <span className="block text-[10px] uppercase font-mono text-slate-500">Phone</span>
                            <span className="text-slate-200">{req.visitor.phoneNumber}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-mono text-slate-500">Government ID</span>
                            <span className="text-slate-200">{req.visitor.identificationType}: {req.visitor.identificationNumber}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-mono text-slate-500">Scheduled Duration</span>
                            <span className="text-slate-200">
                              {new Date(req.expectedEntryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(req.expectedExitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase font-mono text-slate-500">Visitor Count</span>
                            <span className="text-slate-200 font-semibold">{req.totalVisitorCount} Person(s)</span>
                          </div>
                        </div>

                        {req.accompanyingGuests?.length > 0 && (
                          <div className="text-xs text-slate-400 bg-slate-950 p-2 rounded border border-slate-800 mt-2">
                            <span className="text-slate-500 text-[10px] uppercase font-mono mr-2">Accompanying Guests:</span>
                            {req.accompanyingGuests.map((g) => g.name).join(', ')}
                          </div>
                        )}

                        <div className="text-xs text-slate-300 italic pt-1">
                          Purpose: "{req.purpose}"
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex sm:flex-col gap-2 shrink-0">
                        <button
                          onClick={() => handleApprove(req.requestId)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Approve & Issue QR</span>
                        </button>

                        <button
                          onClick={() => setRejectModalReq(req)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-800 rounded-lg text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-1.5"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section 2: Personal Visit History (FR-026) */}
        <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-850 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h2 className="font-bold text-white text-sm">Personal Visit History</h2>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 text-xs">
              {['ALL', 'APPROVED', 'REJECTED', 'EXPIRED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setHistoryFilter(f)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                    historyFilter === f
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-800">
            {dashboardData?.historicalRequests
              ?.filter((r) => historyFilter === 'ALL' || r.requestStatus === historyFilter)
              .map((req) => (
                <div key={req.requestId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-850/30 transition">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-slate-400">{req.requestId}</span>
                      <span className="font-bold text-white text-sm">{req.visitor.fullName}</span>
                      <StatusBadge status={req.requestStatus} />
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-4">
                      <span>Date: {req.visitDate}</span>
                      <span>Visitors: {req.totalVisitorCount}</span>
                      <span>Purpose: {req.purpose}</span>
                      {req.rejectionReason && (
                        <span className="text-rose-400 italic">Reason: {req.rejectionReason}</span>
                      )}
                    </div>
                  </div>

                  {req.requestStatus === 'APPROVED' && (
                    <Link
                      to={`/pass/${req.requestId}`}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-center transition"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View Pass</span>
                    </Link>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Modal: Rejection Reason (FR-025) */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl p-6 shadow-2xl">
            <h3 className="font-bold text-white text-base mb-2">Reject Visit Request</h3>
            <p className="text-xs text-slate-400 mb-4">
              Please provide an optional reason or message for visitor <strong>{rejectModalReq.visitor.fullName}</strong>.
            </p>
            <form onSubmit={handleRejectConfirm}>
              <textarea
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Attending college laboratory; not available at room."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 mb-4"
              ></textarea>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalReq(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejecting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                >
                  {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pre-Register Visitor (FR-008) */}
      {isPreRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-white text-base mb-1">Pre-Register Anticipated Visitor</h3>
            <p className="text-xs text-slate-400 mb-4">
              Submit your guest's credentials in advance. Permitted visiting window: 06:00 to 19:00 IST.
            </p>

            <form onSubmit={handlePreRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Visitor Full Name
                </label>
                <input
                  type="text"
                  required
                  value={preRegForm.visitorName}
                  onChange={(e) => setPreRegForm({ ...preRegForm, visitorName: e.target.value })}
                  placeholder="e.g. Anand Mahindra"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={preRegForm.visitorPhone}
                    onChange={(e) => setPreRegForm({ ...preRegForm, visitorPhone: e.target.value })}
                    placeholder="+91 98290 12345"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Government ID Type
                  </label>
                  <select
                    value={preRegForm.identificationType}
                    onChange={(e) => setPreRegForm({ ...preRegForm, identificationType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Aadhaar Card">Aadhaar Card</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Passport">Passport</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Government ID">Government ID</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  ID Document Number
                </label>
                <input
                  type="text"
                  required
                  value={preRegForm.identificationNumber}
                  onChange={(e) => setPreRegForm({ ...preRegForm, identificationNumber: e.target.value })}
                  placeholder="e.g. 5432-1098-7654"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={preRegForm.visitDate}
                    onChange={(e) => setPreRegForm({ ...preRegForm, visitDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Entry Time
                  </label>
                  <input
                    type="time"
                    required
                    value={preRegForm.expectedEntryTimeStr}
                    onChange={(e) => setPreRegForm({ ...preRegForm, expectedEntryTimeStr: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Exit Time
                  </label>
                  <input
                    type="time"
                    required
                    value={preRegForm.expectedExitTimeStr}
                    onChange={(e) => setPreRegForm({ ...preRegForm, expectedExitTimeStr: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Accompanying Guest Name (Optional)
                </label>
                <input
                  type="text"
                  value={preRegForm.accompanyingGuestName}
                  onChange={(e) => setPreRegForm({ ...preRegForm, accompanyingGuestName: e.target.value })}
                  placeholder="e.g. Radhika Sharma"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Purpose of Visit
                </label>
                <input
                  type="text"
                  required
                  value={preRegForm.purpose}
                  onChange={(e) => setPreRegForm({ ...preRegForm, purpose: e.target.value })}
                  placeholder="e.g. Project consultation / Family meeting"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPreRegisterOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={preRegLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                >
                  {preRegLoading ? 'Submitting...' : 'Create Pre-Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
