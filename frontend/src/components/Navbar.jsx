import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Bell, LogOut, X, ExternalLink } from 'lucide-react';

const LNMIITLogoMark = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-8 h-8 rounded bg-white p-1 flex items-center justify-center shadow-sm border border-slate-200">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L3 6V12C3 17.5 6.8 22.5 12 24C17.2 22.5 21 17.5 21 12V6L12 2Z" fill="#0067A5" />
        <path d="M12 6L6 9V13.5C6 17.5 8.6 21 12 22C15.4 21 18 17.5 18 13.5V9L12 6Z" fill="#E86100" fillOpacity="0.2" stroke="#FFFFFF" strokeWidth="1.2" />
        <path d="M9 12L11 14L15 10" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
    <div>
      <div className="flex items-center gap-1.5 leading-none">
        <span className="font-sans text-sm font-bold text-white tracking-tight">
          THE LNMIIT
        </span>
        <span className="text-[10px] font-sans font-semibold text-lnmiit-orange-light bg-lnmiit-orange px-1.5 py-0.5 rounded">
          MIS / ERP
        </span>
      </div>
      <div className="text-[10px] text-sky-100 font-sans tracking-wide mt-0.5">
        HostGuard Visitor Entry Platform
      </div>
    </div>
  </div>
);

const ROLE_CONFIG = {
  ADMIN: { label: 'ADMINISTRATOR', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  WARDEN: { label: 'CHIEF WARDEN', color: 'text-lnmiit-blue', bg: 'bg-sky-50 border-sky-200' },
  GUARD: { label: 'GATE SECURITY', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  STUDENT: { label: 'STUDENT HOST', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200' },
};

const NAV_LINKS = {
  GUARD: [{ to: '/guard', label: 'Gate Security Console' }],
  STUDENT: [{ to: '/student', label: 'My Host Portal' }],
  WARDEN: [{ to: '/warden', label: 'Hostel Operations' }],
  ADMIN: [
    { to: '/admin', label: 'System Admin' },
    { to: '/warden', label: 'Warden Console' },
    { to: '/guard', label: 'Gate Scanner' },
  ],
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export const Navbar = () => {
  const { user, logout, notifications, unreadCount, markAllRead } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notifsRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleConfig = user ? (ROLE_CONFIG[user.role] || ROLE_CONFIG.STUDENT) : null;
  const navLinks = user ? (NAV_LINKS[user.role] || []) : [];

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Top Institutional Header Bar (Official LNMIIT Medium Persian Blue: #0067A5) */}
      <div className="bg-[#0067A5] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">

            {/* Brand Logo & Institute Name */}
            <Link to="/" className="flex items-center gap-3 select-none group">
              <LNMIITLogoMark />
            </Link>

            {/* Right Controls: Notifications & User Profile */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {/* Notifications Icon */}
                  <div className="relative" ref={notifsRef}>
                    <button
                      onClick={() => {
                        setShowNotifs(!showNotifs);
                        if (!showNotifs && unreadCount > 0) markAllRead();
                      }}
                      className="relative p-2 rounded text-sky-100 hover:text-white hover:bg-white/10 transition-colors"
                      aria-label="Notifications"
                    >
                      <Bell className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-lnmiit-orange animate-pulse-subtle" />
                      )}
                    </button>

                    {showNotifs && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded shadow-erp-dropdown text-slate-800 overflow-hidden animate-fade-in z-50">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                          <span className="text-xs font-bold text-slate-700">MIS Notifications</span>
                          <button onClick={() => setShowNotifs(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-6 text-center text-xs text-slate-400">No new notices</div>
                          ) : (
                            notifications.slice(0, 15).map((n) => (
                              <div
                                key={n._id}
                                className={`px-4 py-2.5 border-b border-slate-100 text-xs ${!n.isRead ? 'bg-sky-50/60' : ''}`}
                              >
                                <p className="text-slate-800 font-medium leading-snug">{n.message}</p>
                                <span className="text-[10px] text-slate-400 font-mono mt-1 block">{timeAgo(n.createdAt)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Badge Info */}
                  <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-white/20 text-right">
                    <div>
                      <div className="text-xs font-semibold text-white leading-tight">{user.name}</div>
                      <div className="flex items-center justify-end gap-1.5 mt-0.5 text-[10px]">
                        <span className="text-sky-200 font-mono font-medium">
                          {user.profile?.rollNumber || user.profile?.guardId || user.email}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sign Out Button */}
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded text-sky-100 hover:text-white hover:bg-red-600/80 transition-colors"
                    title="Sign Out from MIS"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 bg-white text-lnmiit-blue hover:bg-slate-100 text-xs font-bold rounded shadow-sm transition-colors"
                >
                  ERP Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navbar (White/Slate Bar with ERP Tabs) */}
      {user && navLinks.length > 0 && (
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between h-10">
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                      active
                        ? 'text-lnmiit-blue bg-lnmiit-blue-light border-b-2 border-lnmiit-blue'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded border ${roleConfig.color} ${roleConfig.bg}`}>
                {roleConfig.label}
              </span>
              <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                SESSION: VERIFIED
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
