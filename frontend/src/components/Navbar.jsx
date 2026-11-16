import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Shield, Bell, LogOut, X, User } from 'lucide-react';

const ROLE_CONFIG = {
  ADMIN: { label: 'ADMIN', color: 'text-purple-700 bg-purple-50 border-purple-200' },
  WARDEN: { label: 'WARDEN', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  GUARD: { label: 'GUARD', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  STUDENT: { label: 'HOST', color: 'text-zinc-700 bg-zinc-100 border-zinc-200' },
};

const NAV_LINKS = {
  GUARD: [{ to: '/guard', label: 'Gate Security Console' }],
  STUDENT: [{ to: '/student', label: 'Student Host Portal' }],
  WARDEN: [{ to: '/warden', label: 'Warden Monitoring' }],
  ADMIN: [
    { to: '/admin', label: 'Admin Console' },
    { to: '/warden', label: 'Warden View' },
    { to: '/guard', label: 'Gate Console' },
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
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* Left: Brand & Navigation */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 select-none group">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                <Shield className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-sans text-sm font-bold tracking-tight text-zinc-900">
                  HostGuard
                </span>
                <span className="text-[10px] font-mono font-medium text-zinc-500 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded-full">
                  LNMIIT
                </span>
              </div>
            </Link>

            {/* Nav Links */}
            {navLinks.length > 0 && (
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right: Notifications & User Profile */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Notifications Dropdown */}
                <div className="relative" ref={notifsRef}>
                  <button
                    onClick={() => {
                      setShowNotifs(!showNotifs);
                      if (!showNotifs && unreadCount > 0) markAllRead();
                    }}
                    className="relative p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse-subtle" />
                    )}
                  </button>

                  {showNotifs && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-zinc-200 rounded-xl shadow-popover text-zinc-800 overflow-hidden animate-fade-in z-50">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
                        <span className="text-xs font-semibold text-zinc-700">Notifications</span>
                        <button onClick={() => setShowNotifs(false)} className="text-zinc-400 hover:text-zinc-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-xs text-zinc-400">No new notices</div>
                        ) : (
                          notifications.slice(0, 15).map((n) => (
                            <div
                              key={n._id}
                              className={`px-4 py-3 text-xs transition-colors ${!n.isRead ? 'bg-zinc-50/80' : 'hover:bg-zinc-50/40'}`}
                            >
                              <p className="text-zinc-800 font-medium leading-relaxed">{n.message}</p>
                              <span className="text-[10px] text-zinc-400 font-mono mt-1 block">{timeAgo(n.createdAt)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Profile Pill */}
                <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
                  <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-zinc-100/80 border border-zinc-200/70 text-zinc-800">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-xs font-medium max-w-[130px] truncate">
                      {user.profile?.fullName || user.email?.split('@')[0]}
                    </span>
                    <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border ${roleConfig?.color}`}>
                      {roleConfig?.label}
                    </span>
                  </div>

                  {/* Sign Out Button */}
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/visitor"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                >
                  Visitor Kiosk
                </Link>
                <Link
                  to="/login"
                  className="btn-primary py-1.5 text-xs"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
