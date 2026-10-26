import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Shield, Lock, User, AlertCircle, ArrowRight, CheckCircle2, QrCode } from 'lucide-react';

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

  const handleQuickLogin = (email, pass) => {
    setIdentifier(email);
    setPassword(pass);
    setError('');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Top subtle highlight */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600"></div>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 mb-3">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white font-mono">HOSTGUARD</h1>
            <p className="text-xs text-slate-400 mt-1">Hostel Visitor Entry Management System · LNMIIT</p>
          </div>

          {/* Error notice */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Institutional ID / Email / Roll No.
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 24ucs049@lnmiit.ac.in or 24UCS049"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold tracking-wider uppercase transition shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Selector for Viva */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>Quick Demo Profiles (Team T049)</span>
              <span className="text-[10px] text-blue-400 font-mono">1-Click Fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('guard1@lnmiit.ac.in', 'Password@123')}
                className="p-2 rounded bg-slate-950/70 border border-slate-800 hover:border-emerald-600 text-left transition group"
              >
                <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                  <span>Guard (G012)</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">Ramesh Singh · BH1</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('24ucs049@lnmiit.ac.in', 'Password@123')}
                className="p-2 rounded bg-slate-950/70 border border-slate-800 hover:border-blue-500 text-left transition group"
              >
                <div className="text-[11px] font-semibold text-blue-400 flex items-center gap-1">
                  <span>Student (Host)</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">24UCS049 · Charith</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('warden.bh1@lnmiit.ac.in', 'Password@123')}
                className="p-2 rounded bg-slate-950/70 border border-slate-800 hover:border-amber-500 text-left transition group"
              >
                <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                  <span>Warden (BH1)</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">Dr. Sunil Kumar</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@lnmiit.ac.in', 'Password@123')}
                className="p-2 rounded bg-slate-950/70 border border-slate-800 hover:border-purple-500 text-left transition group"
              >
                <div className="text-[11px] font-semibold text-purple-400 flex items-center gap-1">
                  <span>Admin</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">Chief Security Officer</div>
              </button>
            </div>
          </div>

          {/* Visitor Self Registration Link */}
          <div className="mt-4 pt-3 text-center border-t border-slate-800/60">
            <Link
              to="/visitor"
              className="text-xs text-slate-400 hover:text-blue-400 inline-flex items-center gap-1.5 transition"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-400" />
              <span>Are you a visitor at the gate? Self-register here</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
