import React, { useState } from 'react';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  ArrowRight,
  User,
  Phone,
  Home,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const getISTTimeInput = (value) => {
  if (!value) return '';
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(value));
  const hour = parts.find((part) => part.type === 'hour')?.value;
  const minute = parts.find((part) => part.type === 'minute')?.value;
  return hour && minute ? `${hour}:${minute}` : '';
};

export const VisitorKiosk = () => {
  const [activeTab, setActiveTab] = useState('REGISTER'); // 'REGISTER' | 'STATUS'

  // Self-Registration Form
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorPhone: '',
    identificationType: 'Aadhaar Card',
    identificationNumber: '',
    hostStudentRollNumber: '',
    hostelId: 'BH1',
    roomNumber: 'B-201',
    purpose: 'Campus Visit',
    visitDate: new Date().toISOString().split('T')[0],
    expectedEntryTimeStr: '16:00',
    expectedExitTimeStr: '18:00',
    accompanyingGuests: [],
  });

  const [guestNameInput, setGuestNameInput] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [formError, setFormError] = useState('');

  // Status Search State
  const [searchRequestId, setSearchRequestId] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [trackedRequest, setTrackedRequest] = useState(null);
  const [trackedAccessToken, setTrackedAccessToken] = useState('');
  const [searchError, setSearchError] = useState('');

  const handleAddGuest = () => {
    if (!guestNameInput.trim()) return;
    if (formData.accompanyingGuests.length >= 4) {
      alert('Quota Limit (FR-011): Maximum 5 visitors total (1 primary + 4 accompanying guests).');
      return;
    }
    setFormData({
      ...formData,
      accompanyingGuests: [...formData.accompanyingGuests, { name: guestNameInput.trim() }],
    });
    setGuestNameInput('');
  };

  const handleRemoveGuest = (index) => {
    setFormData({
      ...formData,
      accompanyingGuests: formData.accompanyingGuests.filter((_, i) => i !== index),
    });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitLoading(true);

    try {
      let res = editingRequest
        ? await api.updateRequest(editingRequest.requestId, { ...formData, accessToken: editingRequest.accessToken })
        : await api.createRequest(formData);
      if (editingRequest?.requestStatus === 'DRAFT') res = await api.submitDraft(editingRequest.requestId, editingRequest.accessToken);
      if (res.success && res.request) {
        setSubmittedRequest(res.request);
        if (res.request.accessToken) sessionStorage.setItem(`hg_access_${res.request.requestId}`, res.request.accessToken);
        setEditingRequest(null);
      }
    } catch (err) {
      setFormError(err.message || 'Registration failed.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const startEditingRequest = (request) => {
    setEditingRequest({ requestId: request.requestId, requestStatus: request.requestStatus, accessToken: request.accessToken || trackedAccessToken });
    setFormData({
      visitorName: request.visitor?.fullName || '',
      visitorPhone: request.visitor?.phoneNumber || '',
      identificationType: request.visitor?.identificationType || 'Aadhaar Card',
      identificationNumber: request.visitor?.identificationNumber || '',
      hostStudentRollNumber: request.hostStudentRollNumber || '',
      hostelId: request.hostelId || 'BH1',
      roomNumber: request.roomNumber || '',
      purpose: request.purpose || '',
      visitDate: request.visitDate || '',
      expectedEntryTimeStr: getISTTimeInput(request.expectedEntryTime),
      expectedExitTimeStr: getISTTimeInput(request.expectedExitTime),
      accompanyingGuests: request.accompanyingGuests || []
    });
    setSubmittedRequest(null);
    setActiveTab('REGISTER');
  };

  const handleSaveVisitorDraft = async () => {
    setFormError('');
    setSubmitLoading(true);
    try {
      const res = editingRequest
        ? await api.updateRequest(editingRequest.requestId, { ...formData, accessToken: editingRequest.accessToken })
        : await api.createRequest({ ...formData, isDraft: true });
      if (res.success && res.request) {
        setSubmittedRequest(res.request);
        setEditingRequest(null);
        if (res.request.accessToken) sessionStorage.setItem(`hg_access_${res.request.requestId}`, res.request.accessToken);
      }
    } catch (err) {
      setFormError(err.message || 'Draft could not be saved. Enter the host roll number and try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const cancelTrackedRequest = async () => {
    const request = trackedRequest?.request;
    if (!request || !window.confirm(`Cancel request ${request.requestId}?`)) return;
    try {
      await api.cancelRequest(request.requestId, trackedAccessToken);
      setTrackedRequest({ ...trackedRequest, request: { ...request, requestStatus: 'CANCELLED' } });
    } catch (err) {
      setSearchError(err.message || 'Request could not be cancelled.');
    }
  };

  const handleStatusSearch = async (e) => {
    e.preventDefault();
    if (!searchRequestId.trim()) return;

    setSearchError('');
    setSearchLoading(true);
    setTrackedRequest(null);

    try {
      const query = searchRequestId.trim();
      let res = await api.getRequest(query);
      if (res.success && res.request) {
        const accessToken = query.startsWith('PASSKEY-')
          ? query
          : sessionStorage.getItem(`hg_access_${res.request.requestId}`) || '';
        if (accessToken && !query.startsWith('PASSKEY-')) res = await api.getRequest(accessToken);
        setTrackedRequest({
          request: res.request,
          qrPass: res.qrPass,
        });
        setTrackedAccessToken(accessToken);
      }
    } catch (err) {
      setSearchError(err.message || 'Request not found. Please verify reference ID.');
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      
      {/* Kiosk Branding Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-lg bg-base border border-white/[0.08] text-accent mb-1 shadow-lg">
          <QrCode className="w-6 h-6" />
        </div>
        <h1 className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-zinc-100 uppercase">
          VISITOR GATE ENTRY PORTAL
        </h1>
        <p className="text-2xs font-mono text-zinc-500">
          LNMIIT JAIPUR · CAMPUS SECURITY ACCESS CLEARANCE
        </p>
      </div>

      {/* Segmented Control */}
      <div className="flex bg-[#111115] border border-white/[0.08] p-1 rounded-md">
        <button
          onClick={() => {
            setActiveTab('REGISTER');
            setSubmittedRequest(null);
          }}
          className={`flex-1 py-2 rounded text-xs font-mono font-semibold transition-colors ${
            activeTab === 'REGISTER'
              ? 'bg-accent text-white shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          APPLY FOR ENTRY PASS (FR-009)
        </button>
        <button
          onClick={() => setActiveTab('STATUS')}
          className={`flex-1 py-2 rounded text-xs font-mono font-semibold transition-colors ${
            activeTab === 'STATUS'
              ? 'bg-accent text-white shadow'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          CHECK PASS STATUS (FR-015)
        </button>
      </div>

      {/* TAB 1: REGISTRATION */}
      {activeTab === 'REGISTER' && (
        <div className="bg-[#111115] border border-white/[0.08] rounded-lg p-6 space-y-5 animate-fade-in">
          {submittedRequest ? (
            <div className="py-8 text-center space-y-4 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-status-greenBg border border-status-greenBorder text-status-green flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-mono font-bold text-zinc-100 uppercase">
                {submittedRequest.requestStatus === 'DRAFT' ? 'DRAFT SAVED' : 'CLEARANCE REQUEST SUBMITTED'}
              </h2>
              <div className="p-3 bg-base border border-white/[0.06] rounded inline-block">
                <span className="text-2xs font-mono text-zinc-500 block">REFERENCE TRACKING ID</span>
                <span className="text-base font-mono font-bold text-accent">{submittedRequest.requestId}</span>
                <span className="text-2xs font-mono text-zinc-500 block mt-2">PRIVATE EDIT / CANCEL KEY · SAVE THIS KEY</span>
                <span className="text-2xs font-mono font-bold text-zinc-200 break-all">{submittedRequest.accessToken}</span>
              </div>
              <p className="text-2xs font-mono text-zinc-400 max-w-sm mx-auto">
                {submittedRequest.requestStatus === 'DRAFT'
                  ? 'This draft is saved but has not been sent to the host. Keep the private key to resume it later.'
                  : `Host student (${submittedRequest.hostStudentRollNumber}) has been notified. They have 20 minutes to authorize your clearance before this request expires (BR-006).`}
              </p>
              <div className="pt-2">
                {submittedRequest.requestStatus === 'DRAFT' ? <button onClick={() => startEditingRequest(submittedRequest)} className="px-5 py-2.5 bg-[#252529] hover:bg-[#303036] text-zinc-100 text-xs font-mono font-semibold rounded">CONTINUE EDITING DRAFT</button> : <Link
                  to={`/pass/${submittedRequest.accessToken}`}
                  className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-mono font-semibold rounded inline-flex items-center gap-2 transition-colors"
                >
                  <span>MONITOR DIGITAL PASS LIVE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>}
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              {formError && (
                <div className="p-3 rounded bg-status-redBg border border-status-redBorder text-status-red text-xs font-mono flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Section 1: Visitor Identity */}
              <div className="space-y-3">
                <span className="text-2xs font-mono uppercase tracking-wider text-zinc-500 block pb-1 border-b border-white/[0.06]">
                  01 · PRIMARY VISITOR CREDENTIALS
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">FULL LEGAL NAME</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={formData.visitorName}
                      onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                      className="form-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="form-label">PHONE NUMBER</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9829012345"
                      value={formData.visitorPhone}
                      onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
                      className="form-input text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="form-label">GOVT IDENTIFICATION TYPE</label>
                    <select
                      value={formData.identificationType}
                      onChange={(e) => setFormData({ ...formData, identificationType: e.target.value })}
                      className="form-input text-xs font-mono"
                    >
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Other">Other Government ID</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">GOVT ID NUMBER</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. XXXX-XXXX-1234"
                      value={formData.identificationNumber}
                      onChange={(e) => setFormData({ ...formData, identificationNumber: e.target.value })}
                      className="form-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="form-label">VEHICLE NO. (OPTIONAL)</label>
                    <input
                      type="text"
                      placeholder="e.g. RJ-14-EA-1234"
                      value={formData.vehicleNumber || ''}
                      onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                      className="form-input text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Host Destination */}
              <div className="space-y-3 pt-2">
                <span className="text-2xs font-mono uppercase tracking-wider text-zinc-500 block pb-1 border-b border-white/[0.06]">
                  02 · HOST STUDENT & DESTINATION
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="form-label">HOST ROLL NUMBER</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 24UCS049"
                      value={formData.hostStudentRollNumber}
                      onChange={(e) => setFormData({ ...formData, hostStudentRollNumber: e.target.value.toUpperCase() })}
                      className="form-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="form-label">HOSTEL</label>
                    <select
                      value={formData.hostelId}
                      onChange={(e) => setFormData({ ...formData, hostelId: e.target.value })}
                      className="form-input text-xs font-mono"
                    >
                      <option value="BH1">BH1 (Boys Hostel 1)</option>
                      <option value="BH2">BH2 (Boys Hostel 2)</option>
                      <option value="BH3">BH3 (Boys Hostel 3)</option>
                      <option value="GH">GH (Girls Hostel)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">ROOM NUMBER</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B-201"
                      value={formData.roomNumber}
                      onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                      className="form-input text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">PURPOSE OF VISIT</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Project consultation / Family visit"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="form-input text-xs font-mono"
                  />
                </div>
              </div>

              {/* Section 3: Schedule */}
              <div className="space-y-3 pt-2">
                <span className="text-2xs font-mono uppercase tracking-wider text-zinc-500 block pb-1 border-b border-white/[0.06]">
                  03 · SCHEDULE WINDOW (08:00 - 19:00 IST)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="form-label">DATE</label>
                    <input
                      type="date"
                      required
                      value={formData.visitDate}
                      onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                      className="form-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="form-label">EXPECTED ARRIVAL</label>
                    <input
                      type="time"
                      required
                      value={formData.expectedEntryTimeStr}
                      onChange={(e) => setFormData({ ...formData, expectedEntryTimeStr: e.target.value })}
                      className="form-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="form-label">EXPECTED DEPARTURE</label>
                    <input
                      type="time"
                      required
                      value={formData.expectedExitTimeStr}
                      onChange={(e) => setFormData({ ...formData, expectedExitTimeStr: e.target.value })}
                      className="form-input text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Accompanying Guests */}
              <div className="space-y-3 pt-2">
                <span className="text-2xs font-mono uppercase tracking-wider text-zinc-500 block pb-1 border-b border-white/[0.06]">
                  04 · ACCOMPANYING GUESTS (MAX 4 ADDITIONAL)
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Guest full legal name"
                    value={guestNameInput}
                    onChange={(e) => setGuestNameInput(e.target.value)}
                    className="form-input text-xs font-mono flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddGuest}
                    className="px-3.5 py-2 bg-[#252529] hover:bg-[#303036] text-zinc-200 text-xs font-mono font-semibold rounded border border-white/[0.08] transition-colors"
                  >
                    ADD GUEST
                  </button>
                </div>

                {formData.accompanyingGuests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formData.accompanyingGuests.map((g, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-base border border-white/[0.08] text-2xs font-mono text-zinc-300"
                      >
                        <span>{g.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGuest(idx)}
                          className="text-zinc-500 hover:text-status-red"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={handleSaveVisitorDraft}
                  disabled={submitLoading}
                  className="w-full mb-2 py-2 bg-[#252529] hover:bg-[#303036] text-zinc-200 text-xs font-mono font-semibold rounded transition-colors disabled:opacity-50"
                >
                  {editingRequest ? 'SAVE CHANGES' : 'SAVE DRAFT'}
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full py-3 bg-accent hover:bg-accent-hover text-white text-xs font-mono font-semibold rounded uppercase tracking-wider transition-colors disabled:opacity-50"
                >
                  {submitLoading ? 'SAVING...' : editingRequest?.requestStatus === 'DRAFT' ? 'SUBMIT COMPLETED DRAFT' : editingRequest ? 'SAVE REQUEST CHANGES' : 'SUBMIT CLEARANCE APPLICATION'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: STATUS CHECK */}
      {activeTab === 'STATUS' && (
        <div className="bg-[#111115] border border-white/[0.08] rounded-lg p-6 space-y-5 animate-fade-in">
          <div>
            <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400 block mb-2">
              TRACK BY REQUEST ID OR PRIVATE KEY
            </span>
            <form onSubmit={handleStatusSearch} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Request ID or PASSKEY edit key"
                value={searchRequestId}
                onChange={(e) => setSearchRequestId(e.target.value)}
                className="form-input text-xs font-mono flex-1"
              />
              <button
                type="submit"
                disabled={searchLoading}
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-mono font-semibold rounded transition-colors"
              >
                {searchLoading ? 'QUERYING...' : 'SEARCH'}
              </button>
            </form>
          </div>

          {searchError && (
            <div className="p-3 rounded bg-status-redBg border border-status-redBorder text-status-red text-xs font-mono">
              {searchError}
            </div>
          )}

          {trackedRequest && (
            <div className="p-4 bg-base border border-white/[0.06] rounded-md space-y-3 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
                <div>
                  <span className="text-2xs font-mono text-zinc-500">{trackedRequest.request.requestId}</span>
                  <h3 className="text-xs font-bold text-zinc-100">{trackedRequest.request.visitor.fullName}</h3>
                </div>
                <StatusBadge status={trackedRequest.request.requestStatus} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-2xs font-mono">
                <div>
                  <span className="text-zinc-500">HOST:</span>{' '}
                  <span className="text-blue-400 font-bold">{trackedRequest.request.hostStudentRollNumber}</span>
                </div>
                <div>
                  <span className="text-zinc-500">ROOM:</span>{' '}
                  <span className="text-zinc-200">{trackedRequest.request.hostelId} · {trackedRequest.request.roomNumber}</span>
                </div>
              </div>

              {trackedRequest.request.requestStatus === 'APPROVED' && (
                <div className="pt-2">
                  <Link
                    to={`/pass/${trackedAccessToken || trackedRequest.request.requestId}`}
                    className="w-full py-2 bg-status-green hover:bg-green-600 text-black text-xs font-mono font-bold rounded flex items-center justify-center gap-2 transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>OPEN DIGITAL PASS NOW</span>
                  </Link>
                </div>
              )}
              {!trackedAccessToken && ['PENDING', 'APPROVED'].includes(trackedRequest.request.requestStatus) && <p className="text-2xs font-mono text-status-amber">Enter the private PASSKEY edit key to change or cancel this request.</p>}
              {trackedAccessToken && ['PENDING', 'APPROVED'].includes(trackedRequest.request.requestStatus) && (
                <div className="flex gap-2 pt-2">
                  <button onClick={() => startEditingRequest(trackedRequest.request)} className="flex-1 py-2 bg-[#252529] hover:bg-[#303036] text-zinc-200 text-xs font-mono rounded">EDIT REQUEST</button>
                  <button onClick={cancelTrackedRequest} className="flex-1 py-2 bg-status-redBg hover:bg-status-red text-status-red hover:text-white text-xs font-mono rounded">CANCEL REQUEST</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
