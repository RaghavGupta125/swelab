import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Shield,
  Bell,
  LogOut,
  User,
  KeyRound,
  QrCode,
  Users,
  FileText,
  AlertTriangle,
  Menu,
  X,
  ExternalLink
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout, notifications, unreadCount, markAllRead } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-mono px-2 py-0.5 rounded">ADMIN</span>;
      case 'WARDEN':
        return <span className="bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-mono px-2 py-0.5 rounded">WARDEN</span>;
      case 'GUARD':
        return <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono px-2 py-0.5 rounded">GATE GUARD</span>;
      case 'STUDENT':
        return <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono px-2 py-0.5 rounded">STUDENT</span>;
      default:
        return null;
    }
  };

  return (
    <header className="bg-hg-slate-900 border-b border-hg-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand mark */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/30 transition">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight text-lg text-white font-mono">HOSTGUARD</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-900/60 text-blue-300 border border-blue-700/50 rounded">T049</span>
                </div>
                <div className="text-[11px] text-slate-400 tracking-wider">LNMIIT JAIPUR · CS314</div>
              </div>
            </Link>

            {/* Navigation links based on role */}
            {user && (
              <nav className="hidden md:flex items-center space-x-1">
                {user.role === 'GUARD' && (
                  <>
                    <Link
                      to="/guard"
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                        location.pathname === '/guard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      Gate Console
                    </Link>
                  </>
                )}

                {user.role === 'STUDENT' && (
                  <>
                    <Link
                      to="/student"
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                        location.pathname === '/student' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      Host Approvals
                    </Link>
                  </>
                )}

                {user.role === 'WARDEN' && (
                  <>
                    <Link
                      to="/warden"
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                        location.pathname === '/warden' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      Hostel Workspace
                    </Link>
                  </>
                )}

                {user.role === 'ADMIN' && (
                  <>
                    <Link
                      to="/admin"
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                        location.pathname === '/admin' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      System Admin
                    </Link>
                    <Link
                      to="/warden"
                      className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:bg-slate-800"
                    >
                      Warden View
                    </Link>
                    <Link
                      to="/guard"
                      className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:bg-slate-800"
                    >
                      Guard Terminal
                    </Link>
                  </>
                )}
              </nav>
            )}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Public Visitor Portal Link */}
            <Link
              to="/visitor"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-400" />
              Visitor Kiosk
            </Link>

            {user ? (
              <>
                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifs(!showNotifs)}
                    className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown Drawer */}
                  {showNotifs && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                      <div className="p-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
                        <div className="text-xs font-semibold text-slate-200">System Notifications</div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-[11px] text-blue-400 hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-800">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">No notifications yet.</div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.notificationId}
                              className={`p-3 text-xs transition ${
                                notif.isRead ? 'bg-transparent text-slate-400' : 'bg-slate-800/60 text-slate-200 font-medium'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-white">{notif.title}</span>
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[11px] leading-relaxed text-slate-300">{notif.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Info & Role Pill */}
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-white leading-tight">{user.name}</div>
                    <div className="flex items-center gap-1.5 justify-end mt-0.5">
                      {getRoleBadge(user.role)}
                      {user.profile?.rollNumber && (
                        <span className="text-[10px] font-mono text-slate-400">{user.profile.rollNumber}</span>
                      )}
                      {user.profile?.guardId && (
                        <span className="text-[10px] font-mono text-emerald-400">{user.profile.guardId}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold tracking-wide transition shadow"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
