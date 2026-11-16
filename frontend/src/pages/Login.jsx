import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Lock, User, AlertCircle, ArrowRight, QrCode, Shield, CheckCircle } from 'lucide-react';

const LNMIITEmblem = () => (
  <div className="flex items-center gap-3">
    <div className="w-12 h-12 rounded-lg bg-white p-2 flex items-center justify-center shadow border border-slate-200">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L3 6V12C3 17.5 6.8 22.5 12 24C17.2 22.5 21 17.5 21 12V6L12 2Z" fill="#0067A5" />
        <path d="M12 6L6 9V13.5C6 17.5 8.6 21 12 22C15.4 21 18 17.5 18 13.5V9L12 6Z" fill="#E86100" fillOpacity="0.25" stroke="#FFFFFF" strokeWidth="1.2" />
        <path d="M9 12L11 14L15 10" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <div>
      <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">
        The LNM Institute of Information Technology
      </h1>
      <div className="text-xs text-slate-500 font-medium">
        Jaipur, Rajasthan · Deemed-to-be-University
      </div>
    </div>
  </div>
);

const DEMO_ACCOUNTS = [
  {
    role: 'GUARD',
    label: 'Gate Security Guard',
    name: 'G012 · Gate BH1',
    email: 'guard1@lnmiit.ac.in',
    badge: 'text-emerald-700 bg-emerald-50 border-emerald-300',
  },
  {
    role: 'STUDENT',
    label: 'Host Student',
    name: '24UCS049 · Charith',
    email: '24ucs049@lnmiit.ac.in',
    badge: 'text-slate-700 bg-slate-100 border-slate-300',
  },
  {
    role: 'WARDEN',
    label: 'Hostel Chief Warden',
    name: 'Dr. Sunil Kumar (BH1)',
    email: 'warden.bh1@lnmiit.ac.in',
    badge: 'text-blue-700 bg-blue-50 border-blue-300',
  },
  {
    role: 'ADMIN',
    label: 'System Administrator',
    name: 'Chief Security Officer',
    email: 'admin@lnmiit.ac.in',
    badge: 'text-purple-700 bg-purple-50 border-purple-300',
  },
];

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [selectedUserType, setSelectedUserType] = useState('STUDENT');
  const [identifier, setIdentifier] = useState('24ucs049@lnmiit.ac.in');
  const [password, setPassword] = useState('Password@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ssoEnabled, setSsoEnabled] = useState(false);

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const ssoToken = fragment.get('ssoToken');
    const ssoError = fragment.get('ssoError');
    if (ssoToken) {
      localStorage.setItem('hg_token', ssoToken);
      window.location.replace('/');
      return;
    }
    if (ssoError) {
      setError(ssoError);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    fetch('/api/auth/sso/config')
      .then((response) => response.json())
      .then((data) => setSsoEnabled(Boolean(data.enabled)))
      .catch(() => setSsoEnabled(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(identifier, password);
      const role = res.user.role;

      if (role === 'GUARD') navigate('/guard');
      else if (role === 'STUDENT') navigate('/student');
      else if (role === 'WARDEN') navigate('/warden');
      else if (role === 'ADMIN') navigate('/admin');
      else navigate('/');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (email, role) => {
    setIdentifier(email);
    setPassword('Password@123');
    setSelectedUserType(role);
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#F4F7FB] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Campus Header */}
      <div className="max-w-4xl mx-auto w-full mb-6">
        <LNMIITEmblem />
      </div>

      {/* Main ERP Card Box */}
      <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 bg-white border border-slate-200 rounded-lg shadow-erp-card overflow-hidden">
        
        {/* Left Side: LNMIIT MIS Institutional Panel */}
        <div className="md:col-span-5 bg-gradient-to-br from-[#0067A5] to-[#004C7A] text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Institutional Watermark */}
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <svg width="240" height="240" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L3 6V12C3 17.5 6.8 22.5 12 24C17.2 22.5 21 17.5 21 12V6L12 2Z" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="inline-block px-2.5 py-1 bg-white/15 backdrop-blur-sm rounded text-2xs font-bold uppercase tracking-wider text-sky-100 mb-4 border border-white/20">
              CAMPUS MANAGEMENT ERP · MIS PORTAL
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2 leading-snug">
              Hostel Access & Visitor Entry Management System
            </h2>
            <p className="text-xs text-sky-100/90 leading-relaxed mt-2">
              Centralized platform for university residence access control, single-use dynamic QR pass issuance, and automated overstay discipline.
            </p>

            <div className="mt-6 pt-5 border-t border-white/20 space-y-2 text-xs text-sky-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-lnmiit-orange-light shrink-0" />
                <span>Single-Entry QR Pass Validation (`BR-008`)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-lnmiit-orange-light shrink-0" />
                <span>Concurrent 5-Visitor Quota Enforcement (`BR-001`)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-lnmiit-orange-light shrink-0" />
                <span>19:00 IST Overstay Disciplinary Alert (`BR-010`)</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 mt-6 border-t border-white/20 flex items-center justify-between text-[11px] text-sky-200">
            <span>Course CS314 · Team T049</span>
            <span className="font-mono">LNMIIT JAIPUR</span>
          </div>
        </div>

        {/* Right Side: MIS Login Form (Standard ERP user/pass interface) */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-800">User Login</h3>
                <p className="text-xs text-slate-500">Sign in with your university credentials</p>
              </div>
              <span className="text-2xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                HOSTGUARD MIS v2.4
              </span>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* User Type Selector (standard in LNMIIT ERP / MasterSoft) */}
              <div>
                <label className="form-label">User Type / Role</label>
                <select
                  value={selectedUserType}
                  onChange={(e) => setSelectedUserType(e.target.value)}
                  className="form-input text-xs"
                >
                  <option value="STUDENT">Student (Host Resident)</option>
                  <option value="GUARD">Gate Security Staff</option>
                  <option value="WARDEN">Chief / Hostel Warden</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              <div>
                <label className="form-label">Roll Number / Webmail ID / Employee ID</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 24ucs049@lnmiit.ac.in or guard1@lnmiit.ac.in"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="form-input pl-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input pl-9 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#0067A5] hover:bg-[#004C7A] text-white text-xs font-bold rounded shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <span>{loading ? 'AUTHENTICATING...' : 'SIGN IN TO ERP'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {ssoEnabled && (
              <a
                href="/api/auth/sso/start"
                className="mt-2.5 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-300 flex items-center justify-center transition-colors"
              >
                SIGN IN VIA LNMIIT GOOGLE OIDC SSO
              </a>
            )}

            {/* Quick-Fill Viva Evaluation Matrix */}
            <div className="mt-5 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xs font-semibold uppercase tracking-wider text-slate-500">
                  Viva 1-Click Fast Fill (Demo Accounts)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">PWD: Password@123</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleQuickLogin(acc.email, acc.role)}
                    className="p-2 rounded bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-lnmiit-blue/40 text-left transition-colors flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between w-full mb-0.5">
                      <span className={`text-[9px] font-sans font-bold px-1.5 py-0.5 rounded border ${acc.badge}`}>
                        {acc.label}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-800 truncate">{acc.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{acc.email}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visitor Kiosk Link */}
          <div className="mt-5 pt-3 border-t border-slate-200 text-center">
            <Link
              to="/visitor"
              className="text-xs font-semibold text-[#0067A5] hover:text-[#004C7A] hover:underline inline-flex items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Are you a campus visitor? Register at Gate Kiosk &rarr;</span>
            </Link>
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="max-w-4xl mx-auto w-full mt-6 text-center text-xs text-slate-500">
        <p>© 2026 The LNM Institute of Information Technology. All rights reserved.</p>
        <p className="text-[11px] text-slate-400 mt-0.5">HostGuard Enterprise Access Control · Team T049 CS314</p>
      </div>
    </div>
  );
};
