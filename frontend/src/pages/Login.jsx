import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Shield, Lock, User, AlertCircle, ArrowRight, QrCode } from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    role: 'GUARD',
    label: 'Gate Guard',
    name: 'G012 · Gate BH1',
    email: 'guard1@lnmiit.ac.in',
    badge: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  {
    role: 'STUDENT',
    label: 'Host Student',
    name: '24UCS049 · Charith',
    email: '24ucs049@lnmiit.ac.in',
    badge: 'text-zinc-700 bg-zinc-100 border-zinc-200',
  },
  {
    role: 'WARDEN',
    label: 'Hostel Warden',
    name: 'Dr. Sunil Kumar (BH1)',
    email: 'warden.bh1@lnmiit.ac.in',
    badge: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  {
    role: 'ADMIN',
    label: 'System Admin',
    name: 'Chief Security Officer',
    email: 'admin@lnmiit.ac.in',
    badge: 'text-purple-700 bg-purple-50 border-purple-200',
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
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#FAFAFA] flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 text-white shadow-sm mb-4">
          <Shield className="w-6 h-6 stroke-[2]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Sign in to HostGuard
        </h1>
        <p className="text-xs text-zinc-500 mt-1.5 font-medium">
          The LNM Institute of Information Technology · Visitor Access Platform
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-white border border-zinc-200/90 rounded-2xl shadow-card p-6 sm:p-8">
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role / User Type Selector */}
          <div>
            <label className="form-label">Account Role</label>
            <select
              value={selectedUserType}
              onChange={(e) => setSelectedUserType(e.target.value)}
              className="form-input text-xs"
            >
              <option value="STUDENT">Student (Host Resident)</option>
              <option value="GUARD">Gate Security Staff</option>
              <option value="WARDEN">Hostel Warden</option>
              <option value="ADMIN">System Administrator</option>
            </select>
          </div>

          {/* Identifier Input */}
          <div>
            <label className="form-label">Roll Number / Email / Employee ID</label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
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

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-700">Password</label>
              <span className="text-[11px] font-mono text-zinc-400">Default: Password@123</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
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
            className="btn-primary w-full py-2.5 mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {ssoEnabled && (
          <a
            href="/api/auth/sso/start"
            className="mt-3 w-full py-2 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-medium rounded-lg border border-zinc-200 flex items-center justify-center transition-colors"
          >
            Sign in with LNMIIT Google SSO
          </a>
        )}

        {/* Viva Quick-Fill Matrix */}
        <div className="mt-6 pt-5 border-t border-zinc-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
              Viva 1-Click Fast Fill
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">Demo Accounts</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleQuickLogin(acc.email, acc.role)}
                className="p-2.5 rounded-lg bg-zinc-50 hover:bg-zinc-100/80 border border-zinc-200/80 text-left transition-all active:scale-[0.98] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded border ${acc.badge}`}>
                    {acc.label}
                  </span>
                </div>
                <div className="text-xs font-medium text-zinc-900 truncate">{acc.name}</div>
                <div className="text-[10px] text-zinc-400 font-mono truncate">{acc.email}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Visitor Link */}
        <div className="mt-6 pt-4 border-t border-zinc-100 text-center">
          <Link
            to="/visitor"
            className="text-xs font-medium text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-1.5 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Campus Visitor? Pre-register or access pass &rarr;</span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-zinc-400">
        <p>HostGuard Access Control System · Team T049 (LNMIIT CS314)</p>
      </div>

    </div>
  );
};
