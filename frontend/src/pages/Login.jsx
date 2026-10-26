import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Shield, Lock, User, AlertCircle, ArrowRight, QrCode, CheckCircle2 } from 'lucide-react';

const ShieldMark = () => (
  <svg width="24" height="26" viewBox="0 0 20 22" fill="none" className="shrink-0">
    <path
      d="M10 1L2 4.5V10C2 14.4 5.4 18.5 10 20C14.6 18.5 18 14.4 18 10V4.5L10 1Z"
      fill="#E8531D"
      fillOpacity="0.2"
      stroke="#E8531D"
      strokeWidth="1.75"
      strokeLinejoin="round"
    />
    <path d="M7 11L9 13L13 9" stroke="#E8531D" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const DEMO_ACCOUNTS = [
  {
    role: 'GUARD',
    label: 'Gate Guard',
    name: 'G012 · Gate BH1',
    email: 'guard1@lnmiit.ac.in',
    badge: 'text-status-green bg-status-greenBg border-status-greenBorder',
  },
  {
    role: 'STUDENT',
    label: 'Host Student',
    name: '24UCS049 · Charith',
    email: '24ucs049@lnmiit.ac.in',
    badge: 'text-zinc-300 bg-zinc-800 border-zinc-700',
  },
  {
    role: 'WARDEN',
    label: 'Hostel Warden',
    name: 'Dr. Sunil Kumar (BH1)',
    email: 'warden.bh1@lnmiit.ac.in',
    badge: 'text-blue-400 bg-blue-950/60 border-blue-800',
  },
  {
    role: 'ADMIN',
    label: 'Administrator',
    name: 'Chief Security Officer',
    email: 'admin@lnmiit.ac.in',
    badge: 'text-purple-400 bg-purple-950/60 border-purple-800',
  },
];

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleQuickLogin = (email) => {
    setIdentifier(email);
    setPassword('Password@123');
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-[#111115] border border-white/[0.08] rounded-lg shadow-2xl overflow-hidden">
        
        {/* Left Studio Branding Panel */}
        <div className="md:col-span-5 bg-base p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/[0.07] relative">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-6">
              <ShieldMark />
              <div>
                <span className="font-mono text-base font-bold tracking-tight text-zinc-100">
                  HOSTGUARD
                </span>
                <span className="block text-[9px] font-mono text-zinc-500 tracking-wider">
                  ENTERPRISE ACCESS OPS
                </span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 mb-2">
              High-Assurance Hostel Gate Security
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Institutional visitor workflow automation, biometric-grade QR lifecycle validation, and active overstay prevention.
            </p>
          </div>

          <div className="relative z-10 pt-8 mt-8 border-t border-white/[0.06] space-y-3">
            <div className="flex items-center gap-2 text-2xs font-mono text-zinc-500">
              <div className="w-1.5 h-1.5 rounded-full bg-status-green" />
              <span>LNMIIT JAIPUR · CS314 TEAM T049</span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono">
              SPEC COMPLIANCE: <span className="text-zinc-300 font-semibold">T049(1).pdf BR-001 - BR-012</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/[0.06]">
              <span className="text-2xs font-mono uppercase tracking-[0.1em] text-zinc-400">
                CREDENTIAL AUTHENTICATION
              </span>
              <span className="text-2xs font-mono text-zinc-600">PORTAL v2.4</span>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded bg-status-redBg border border-status-redBorder text-status-red text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Institutional Identifier / Email</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. guard1@lnmiit.ac.in or 24ucs049"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="form-input pl-9 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input pl-9 font-mono text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <span>{loading ? 'AUTHENTICATING...' : 'AUTHORIZE SESSION'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* 1-Click Evaluation Fast-Fill Matrix */}
            <div className="mt-6 pt-5 border-t border-white/[0.06]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-2xs font-mono uppercase tracking-wider text-zinc-500">
                  Viva Quick-Fill (One-Click)
                </span>
                <span className="text-[10px] font-mono text-zinc-600">PWD: Password@123</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleQuickLogin(acc.email)}
                    className="p-2.5 rounded bg-base hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.15] text-left transition-colors flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${acc.badge}`}>
                        {acc.label}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-zinc-300 truncate">{acc.name}</div>
                    <div className="text-[10px] font-mono text-zinc-600 truncate">{acc.email}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visitor Kiosk Link */}
          <div className="mt-6 pt-4 border-t border-white/[0.06] text-center">
            <Link
              to="/visitor"
              className="text-2xs font-mono text-zinc-400 hover:text-accent inline-flex items-center gap-1.5 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>GUEST OR VISITOR SELF-REGISTRATION KIOSK &rarr;</span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};
