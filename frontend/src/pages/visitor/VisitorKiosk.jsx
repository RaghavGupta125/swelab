import React, { useState } from 'react';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import {
  QrCode,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Send,
  Building,
  User,
  Phone,
  Shield,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
    accompanyingGuests: []
  });

  const [guestNameInput, setGuestNameInput] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);
  const [formError, setFormError] = useState('');

  // Status Search State
  const [searchRequestId, setSearchRequestId] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [trackedRequest, setTrackedRequest] = useState(null);
  const [searchError, setSearchError] = useState('');

  const handleAddGuest = () => {
    if (!guestNameInput.trim()) return;
    if (formData.accompanyingGuests.length >= 4) {
      alert('Quota Limit (FR-011): Maximum 5 visitors total (1 primary + 4 accompanying guests).');
      return;
    }
    setFormData({
      ...formData,
      accompanyingGuests: [...formData.accompanyingGuests, { name: guestNameInput.trim() }]
    });
    setGuestNameInput('');
  };

  const handleRemoveGuest = (index) => {
    setFormData({
      ...formData,
      accompanyingGuests: formData.accompanyingGuests.filter((_, i) => i !== index)
    });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitLoading(true);

    try {
      const res = await api.createRequest(formData);
      if (res.success && res.request) {
        setSubmittedRequest(res.request);
      }
    } catch (err) {
      setFormError(err.message || 'Registration failed.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleStatusSearch = async (e) => {
    e.preventDefault();
    if (!searchRequestId.trim()) return;

    setSearchError('');
    setSearchLoading(true);
    setTrackedRequest(null);

    try {
      const res = await api.getRequest(searchRequestId.trim());
      if (res.success && res.request) {
        setTrackedRequest({
          request: res.request,
          qrPass: res.qrPass
        });
      }
    } catch (err) {
      setSearchError(err.message || 'Request not found. Please check reference ID.');
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Kiosk Branding Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 mb-3">
          <QrCode className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight font-mono">
          GATE VISITOR ENTRY PORTAL
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          The LNM Institute of Information Technology, Jaipur · HostGuard Platform
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 mb-6">
        <button
          onClick={() => {
            setActiveTab('REGISTER');
            setSubmittedRequest(null);
          }}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'REGISTER'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Apply for Visitor Gate Pass (FR-009)</span>
        </button>

        <button
          onClick={() => setActiveTab('STATUS')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 'STATUS'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Track Status & Get Pass (FR-018)</span>
        </button>
      </div>

      {/* Mode 1: Success Confirmation Card */}
      {submittedRequest ? (
        <div className="bg-hg-slate-900 border border-emerald-600/50 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-4 animate-fadeIn">
          <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Visit Request Successfully Submitted!</h2>
            <p className="text-xs text-slate-400 mt-1">
              Your request has been dispatched to host student{' '}
              <strong className="text-blue-400">{submittedRequest.hostStudentRollNumber}</strong>.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left max-w-md mx-auto space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Request Tracking ID:</span>
              <span className="font-mono font-bold text-white">{submittedRequest.requestId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Visitor:</span>
              <span className="text-slate-200">{submittedRequest.visitor.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hostel & Room:</span>
              <span className="text-slate-200">{submittedRequest.hostelId} · Room {submittedRequest.roomNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <StatusBadge status="PENDING" />
            </div>
          </div>

          <p className="text-xs text-amber-300/90 font-medium">
            <strong>20-Minute Policy (BR-006):</strong> The host student has 20 minutes to approve your request online.
          </p>

          <div className="pt-2">
            <Link
              to={`/pass/${submittedRequest.requestId}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow"
            >
              <span>View Dynamic Pass Page</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : activeTab === 'REGISTER' ? (
        /* Mode 2: Registration Form */
        <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Primary Visitor Info */}
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Primary Visitor Information</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={formData.visitorName}
                    onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={formData.visitorPhone}
                      onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
                      placeholder="+91 98290 12345"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Government ID Type</label>
                    <select
                      value={formData.identificationType}
                      onChange={(e) => setFormData({ ...formData, identificationType: e.target.value })}
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
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Government ID Number</label>
                  <input
                    type="text"
                    required
                    value={formData.identificationNumber}
                    onChange={(e) => setFormData({ ...formData, identificationNumber: e.target.value })}
                    placeholder="e.g. 1234-5678-9012"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Host Student Info */}
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold mb-3 flex items-center gap-2">
                <Building className="w-4 h-4" />
                <span>Host Student Details (BR-012)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Student Roll No.</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 24UCS049"
                    value={formData.hostStudentRollNumber}
                    onChange={(e) => setFormData({ ...formData, hostStudentRollNumber: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Hostel Block</label>
                  <select
                    value={formData.hostelId}
                    onChange={(e) => setFormData({ ...formData, hostelId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="BH1">Boys Hostel 1 (BH1)</option>
                    <option value="BH2">Boys Hostel 2 (BH2)</option>
                    <option value="BH3">Boys Hostel 3 (BH3)</option>
                    <option value="BH4">Boys Hostel 4 (BH4)</option>
                    <option value="BH5">Boys Hostel 5 (BH5)</option>
                    <option value="GH">Girls Hostel (GH)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Host Room No.</label>
                  <input
                    type="text"
                    required
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="e.g. B-201"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Visit Schedule (BR-004) */}
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Visit Schedule (Permitted: 06:00 to 19:00 IST)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Visit Date</label>
                  <input
                    type="date"
                    required
                    value={formData.visitDate}
                    onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Expected Entry</label>
                  <input
                    type="time"
                    required
                    value={formData.expectedEntryTimeStr}
                    onChange={(e) => setFormData({ ...formData, expectedEntryTimeStr: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Expected Exit</label>
                  <input
                    type="time"
                    required
                    value={formData.expectedExitTimeStr}
                    onChange={(e) => setFormData({ ...formData, expectedExitTimeStr: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Purpose of Visit</label>
                <input
                  type="text"
                  required
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="e.g. Family visit, document handover, academic discussion"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Accompanying Guests (FR-011) */}
            <div className="pb-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Accompanying Guests ({formData.accompanyingGuests.length} / 4 allowed)
                </label>
              </div>

              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Guest name..."
                  value={guestNameInput}
                  onChange={(e) => setGuestNameInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500"
                />
                <button
                  type="button"
                  onClick={handleAddGuest}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold"
                >
                  Add Guest
                </button>
              </div>

              {formData.accompanyingGuests.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.accompanyingGuests.map((g, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-xs text-slate-300"
                    >
                      <span>{g.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveGuest(idx)}
                        className="text-red-400 hover:text-red-300 ml-1 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
            >
              {submitLoading ? 'Transmitting Request...' : 'Submit Entry Request'}
            </button>
          </form>
        </div>
      ) : (
        /* Mode 3: Status Lookup */
        <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <form onSubmit={handleStatusSearch} className="space-y-3">
            <label className="block text-xs font-semibold uppercase text-slate-300">
              Enter Your Request Reference ID or Access Key
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. VR2045 or VR2001"
                value={searchRequestId}
                onChange={(e) => setSearchRequestId(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={searchLoading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition"
              >
                {searchLoading ? 'Searching...' : 'Check Status'}
              </button>
            </div>
          </form>

          {searchError && (
            <div className="p-3 bg-red-950/80 border border-red-800 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {trackedRequest && (
            <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono text-slate-400">ID: {trackedRequest.request.requestId}</span>
                  <h3 className="font-bold text-white text-base mt-0.5">{trackedRequest.request.visitor.fullName}</h3>
                </div>
                <StatusBadge status={trackedRequest.request.requestStatus} />
              </div>

              <div className="text-xs text-slate-300 space-y-1.5">
                <div>Host Student: <strong className="text-blue-400">{trackedRequest.request.hostStudentRollNumber}</strong></div>
                <div>Hostel & Room: <strong>{trackedRequest.request.hostelId} · Room {trackedRequest.request.roomNumber}</strong></div>
                <div>Schedule: {new Date(trackedRequest.request.expectedEntryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(trackedRequest.request.expectedExitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>

              {trackedRequest.request.requestStatus === 'APPROVED' && (
                <div className="pt-2">
                  <Link
                    to={`/pass/${trackedRequest.request.requestId}`}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>View Gate QR Pass</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
