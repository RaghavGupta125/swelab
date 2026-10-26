import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Bell, LogOut, ChevronDown, X, Check } from 'lucide-react';

const ShieldMark = () => (
  <svg width="20" height="22" viewBox="0 0 20 22" fill="none" className="shrink-0">
    <path
      d="M10 1L2 4.5V10C2 14.4 5.4 18.5 10 20C14.6 18.5 18 14.4 18 10V4.5L10 1Z"
      fill="#E8531D"
      fillOpacity="0.15"
      stroke="#E8531D"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M7 11L9 13L13 9" stroke="#E8531D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ROLE_CONFIG = {
  ADMIN: { label: 'ADMIN', color: 'text-purple-400', bg: 'bg-purple-900/40 border-purple-800/60' },
  WARDEN: { label: 'WARDEN', color: 'text-blue-400', bg: 'bg-blue-900/40 border-blue-800/60' },
  GUARD: { label: 'GUARD', color: 'text-status-green', bg: 'bg-status-greenBg border-status-greenBorder' },
  STUDENT: { label: 'STUDENT', color: 'text-zinc-300', bg: 'bg-zinc-800/60 border-zinc-700/60' },
};

const NAV_LINKS = {
  GUARD: [{ to: '/guard', label: 'Gate Console' }],
  STUDENT: [{ to: '/student', label: 'My Portal' }],
  WARDEN: [{ to: '/warden', label: 'Operations' }],
  ADMIN: [
    { to: '/admin', label: 'Admin' },
    { to: '/warden', label: 'Operations' },
    { to: '/guard', label: 'Gate' },
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
    <header className="sticky top-0 z-50 bg-base border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-2.5 select-none group">
            <ShieldMark />
            <div>
              <span className="font-mono text-sm font-bold text-zinc-100 tracking-tight group-hover:text-accent transition-colors">
                HOSTGUARD
              </span>
              <div className="text-[9px] font-mono text-zinc-600 tracking-widest leading-none -mt-0.5">
                CS314 · LNMIIT
              </div>
            </div>
          </Link>

          {/* Desktop Nav */}
          {user && navLinks.length > 0 && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const active = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors relative ${
                      active
                        ? 'text-zinc-100 bg-white/[0.07]'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    {link.label}
                    {active && (
                      <span className="absolute bottom-0 left-3 right-3 h-px bg-accent rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Notification Bell */}
                <div className="relative" ref={notifsRef}>
                  <button
                    onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs && unreadCount > 0) markAllRead(); }}
                    className="relative p-2 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent animate-led-blink" />
                    )}
                  </button>

                  {showNotifs && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-[#111115] border border-white/[0.1] rounded-md shadow-2xl shadow-black/60 overflow-hidden animate-fade-in">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                        <span className="text-xs font-semibold text-zinc-200">Notifications</span>
                        <button onClick={() => setShowNotifs(false)} className="text-zinc-500 hover:text-zinc-200">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-xs text-zinc-600">No notifications</div>
                        ) : (
                          notifications.slice(0, 20).map((n) => (
                            <div
                              key={n._id}
                              className={`px-4 py-3 border-b border-white/[0.04] ${!n.isRead ? 'bg-white/[0.03]' : ''}`}
                            >
                              <div className="flex items-start gap-2">
                                {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-1.5" />}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-zinc-200 leading-snug">{n.message}</p>
                                  <p className="text-[10px] font-mono text-zinc-600 mt-1">{timeAgo(n.createdAt)}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User chip */}
                <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/[0.06]">
                  <div className="text-right">
                    <div className="text-xs font-medium text-zinc-200 leading-tight">{user.name}</div>
                    <div className="flex items-center justify-end gap-1.5 mt-0.5">
                      <span className={`text-[9px] font-mono font-bold tracking-widest px-1.5 py-px rounded border ${roleConfig.color} ${roleConfig.bg}`}>
                        {roleConfig.label}
                      </span>
                      {user.profile?.rollNumber && (
                        <span className="text-[10px] font-mono text-zinc-500">{user.profile.rollNumber}</span>
                      )}
                      {user.profile?.guardId && (
                        <span className="text-[10px] font-mono text-status-green">{user.profile.guardId}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-md text-zinc-600 hover:text-status-red hover:bg-status-redBg transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Mobile menu toggle */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors"
                >
                  {mobileMenuOpen ? <X className="w-4 h-4" /> : (
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                      <rect y="2" width="16" height="1.5" rx="1" />
                      <rect y="7" width="16" height="1.5" rx="1" />
                      <rect y="12" width="16" height="1.5" rx="1" />
                    </svg>
                  )}
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-md transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && user && (
        <div className="md:hidden border-t border-white/[0.06] bg-[#111115] animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-accent/10 text-accent'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-200">{user.name}</div>
                <span className={`text-[9px] font-mono font-bold tracking-widest px-1.5 py-px rounded border ${roleConfig.color} ${roleConfig.bg}`}>
                  {roleConfig.label}
                </span>
              </div>
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-status-red transition-colors">
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
