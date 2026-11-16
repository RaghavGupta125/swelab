import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import {
  Shield,
  Users,
  Building,
  Activity,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';

const ADMIN_TABS = [
  { id: 'USERS', label: 'User & RBAC Access', icon: Users },
  { id: 'AUDIT', label: 'Security Audit Logs', icon: Activity },
  { id: 'HOSTELS', label: 'Hostel Sectors', icon: Building },
];

export const AdminConsole = () => {
  const [overview, setOverview] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('USERS');

  // User search/filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [directorySyncEnabled, setDirectorySyncEnabled] = useState(false);
  const [directorySyncing, setDirectorySyncing] = useState(false);
  const [directorySyncMessage, setDirectorySyncMessage] = useState('');
  const [roleAssignment, setRoleAssignment] = useState(null);

  useEffect(() => {
    loadOverview();
    loadUsers();
    loadAuditLogs();
    api.getDirectorySyncStatus().then((res) => setDirectorySyncEnabled(Boolean(res.enabled))).catch(() => setDirectorySyncEnabled(false));
  }, []);

  const loadOverview = async () => {
    try {
      const res = await api.getSystemOverview();
      if (res.success) setOverview(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.getAllUsers(params);
      if (res.success) setUsersList(res.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await api.getAuditLogs({ limit: 100 });
      if (res.success) setAuditLogs(res.logs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      await api.updateUserStatus(userId, newStatus);
      loadUsers();
      loadOverview();
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    }
  };

  const handleAssignRole = async (user, newRole) => {
    if (newRole === user.role) return;
    if (['STUDENT', 'GUARD', 'WARDEN'].includes(newRole)) {
      const seedId = user.userId || '';
      setRoleAssignment({
        user,
        role: newRole,
        profile: newRole === 'STUDENT'
          ? { studentId: seedId, rollNumber: seedId, hostelId: '', roomNumber: '' }
          : newRole === 'GUARD'
            ? { guardId: seedId, assignedHostelId: '' }
            : { wardenId: seedId, assignedHostelId: '' }
      });
      return;
    }
    try {
      await api.assignUserRole(user.userId, newRole);
      loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to assign role.');
    }
  };

  const saveRoleAssignment = async (event) => {
    event.preventDefault();
    if (!roleAssignment) return;
    try {
      await api.assignUserRole(roleAssignment.user.userId, roleAssignment.role, roleAssignment.profile);
      setRoleAssignment(null);
      await loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to assign role.');
    }
  };

  const handleDirectorySync = async () => {
    setDirectorySyncing(true);
    setDirectorySyncMessage('');
    try {
      const res = await api.syncStudentDirectory();
      const { created = 0, updated = 0, skipped = 0 } = res.summary || {};
      setDirectorySyncMessage(`Directory sync complete · ${created} added · ${updated} updated · ${skipped} skipped`);
      await loadUsers();
    } catch (err) {
      setDirectorySyncMessage(`Directory sync failed: ${err.message}`);
    } finally {
      setDirectorySyncing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner / Metrics */}
      <div className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-base font-bold text-zinc-900 uppercase tracking-tight">
              HOSTGUARD SYSTEM ADMINISTRATION
            </h1>
            <span className="text-2xs font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800">
              CHIEF SECURITY AUTHORITY
            </span>
          </div>
          <div className="text-2xs font-mono text-zinc-500 mt-0.5">
            ACCESS CONTROLS, RBAC POLICIES & IMMUTABLE FORENSIC AUDIT TRAIL
          </div>
        </div>

        {/* Global Key Metrics */}
        <div className="flex items-center gap-3 text-2xs font-mono">
          <div className="bg-base px-3 py-2 rounded border border-zinc-200">
            <span className="text-zinc-500 block">TOTAL ENROLLED</span>
            <span className="text-zinc-900 font-bold text-sm mt-0.5 block">{overview?.totalUsers || 0}</span>
          </div>
          <div className="bg-base px-3 py-2 rounded border border-zinc-200">
            <span className="text-zinc-500 block">ACTIVE INSIDE</span>
            <span className="text-status-green font-bold text-sm mt-0.5 block">{overview?.activeVisitsTotal || 0}</span>
          </div>
          <div className="bg-base px-3 py-2 rounded border border-zinc-200">
            <span className="text-zinc-500 block">OVERSTAYS</span>
            <span className="text-status-red font-bold text-sm mt-0.5 block">{overview?.overstayVisitsTotal || 0}</span>
          </div>
          <button
            onClick={() => {
              loadOverview();
              loadUsers();
              loadAuditLogs();
            }}
            className="p-2 rounded bg-base hover:bg-zinc-100 border border-zinc-200 text-zinc-600 hover:text-zinc-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-zinc-900' : ''}`} />
          </button>
        </div>
      </div>

      {/* Studio Workspace Layout: Sidebar + Main Stage */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Sidebar Nav (3 cols) */}
        <div className="md:col-span-3 space-y-1">
          <div className="text-2xs font-mono uppercase tracking-wider text-zinc-500 px-3 py-1 mb-1">
            ADMIN DOMAINS
          </div>
          {ADMIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-mono font-medium transition-colors text-left ${
                  active
                    ? 'bg-accent/15 text-zinc-900 border border-accent/30 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Workspace Stage (9 cols) */}
        <div className="md:col-span-9 space-y-6">

          {/* TAB 1: USERS & RBAC */}
          {activeTab === 'USERS' && (
            <div className="space-y-4">
              <div className="card p-4 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by name, email, roll number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-input pl-8 text-2xs font-mono py-1.5"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-base border border-zinc-200 rounded px-3 py-1.5 text-2xs font-mono text-zinc-800"
                >
                  <option value="">ALL ROLES</option>
                  <option value="STUDENT">STUDENT</option>
                  <option value="GUARD">GUARD</option>
                  <option value="WARDEN">WARDEN</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-base border border-zinc-200 rounded px-3 py-1.5 text-2xs font-mono text-zinc-800"
                >
                  <option value="">ALL STATUSES</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>
                <button
                  onClick={loadUsers}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white shadow-xs rounded text-2xs font-mono font-semibold transition-colors"
                >
                  FILTER
                </button>
                {directorySyncEnabled && <button
                  onClick={handleDirectorySync}
                  disabled={directorySyncing}
                  className="px-3 py-1.5 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 text-zinc-900 rounded text-2xs font-mono font-semibold transition-colors disabled:opacity-50"
                >{directorySyncing ? 'SYNCING…' : 'SYNC STUDENT DIRECTORY'}</button>}
              </div>
              {directorySyncMessage && <div className="text-2xs font-mono text-zinc-700">{directorySyncMessage}</div>}

              {/* Users Table */}
              <div className="card overflow-x-auto">
                <table className="w-full text-left text-2xs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 bg-base">
                      <th className="p-3">NAME & IDENTIFIER</th>
                      <th className="p-3">CONTACT</th>
                      <th className="p-3">ROLE (RBAC)</th>
                      <th className="p-3">STATUS</th>
                      <th className="p-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-zinc-600">
                          NO ACCOUNTS LOCATED
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => (
                        <tr key={u.userId} className="hover:bg-white/[0.02]">
                          <td className="p-3">
                            <div className="text-zinc-900 font-bold">{u.name}</div>
                            <div className="text-zinc-500 text-[10px]">{u.email}</div>
                            {u.profile?.rollNumber && (
                              <div className="text-blue-600 text-[10px]">{u.profile.rollNumber}</div>
                            )}
                          </td>
                          <td className="p-3 text-zinc-600">{u.phoneNumber || '—'}</td>
                          <td className="p-3">
                            <select
                              value={u.role}
                              onChange={(e) => handleAssignRole(u, e.target.value)}
                              className="bg-base border border-zinc-200 rounded px-2 py-1 text-2xs font-mono text-zinc-800"
                            >
                              <option value="STUDENT">STUDENT</option>
                              <option value="GUARD">GUARD</option>
                              <option value="WARDEN">WARDEN</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>
                          <td className="p-3">
                            <StatusBadge status={u.accountStatus} />
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleUpdateStatus(u.userId, u.accountStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE')}
                              className={`px-2.5 py-1 rounded text-2xs font-mono font-semibold transition-colors ${
                                u.accountStatus === 'ACTIVE'
                                  ? 'bg-zinc-100 text-zinc-800 hover:bg-status-red hover:text-white text-zinc-600 border border-zinc-200'
                                  : 'bg-status-green hover:bg-green-600 text-black'
                              }`}
                            >
                              {u.accountStatus === 'ACTIVE' ? 'BLOCK' : 'ACTIVATE'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIT TRAIL */}
          {activeTab === 'AUDIT' && (
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse-subtle" />
                  <span className="text-2xs font-mono uppercase tracking-wider text-zinc-700 font-bold">
                    IMMUTABLE FORENSIC AUDIT TRAIL (NFR-020)
                  </span>
                </div>
                <span className="text-2xs font-mono text-zinc-600">LAST 100 EVENTS</span>
              </div>

              <div className="bg-base border border-zinc-200 rounded font-mono text-2xs overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-200 text-zinc-500 bg-zinc-50 sticky top-0">
                      <th className="p-2.5">TIMESTAMP</th>
                      <th className="p-2.5">ACTION</th>
                      <th className="p-2.5">PERFORMED BY</th>
                      <th className="p-2.5">ROLE</th>
                      <th className="p-2.5">TELEMETRY DATA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-zinc-600">
                          NO AUDIT LOGS RECORDED
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-white/[0.02]">
                          <td className="p-2.5 text-zinc-500 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="p-2.5 text-zinc-900 font-semibold whitespace-nowrap">{log.action}</td>
                          <td className="p-2.5 text-zinc-800">{log.performedBy?.name || 'SYSTEM'}</td>
                          <td className="p-2.5 text-zinc-600">{log.performedBy?.role || 'SYSTEM'}</td>
                          <td className="p-2.5 text-zinc-600 max-w-xs truncate">
                            {JSON.stringify(log.details)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: HOSTEL SECTORS */}
          {activeTab === 'HOSTELS' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {overview?.hostels?.map((h) => (
                <div key={h.hostelId} className="card p-5 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-base font-bold text-zinc-900">{h.hostelId}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                        {h.type}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-zinc-700 mt-1">{h.hostelName}</div>
                  </div>

                  <div className="pt-3 border-t border-zinc-200 flex items-center justify-between text-2xs font-mono">
                    <span className="text-zinc-500">CURRENT OCCUPANCY:</span>
                    <span className="text-status-green font-bold">{h.activeVisitorsCount} ACTIVE</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {roleAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-xs">
          <form onSubmit={saveRoleAssignment} className="w-full max-w-lg card shadow-2xl p-5 space-y-4">
            <div>
              <h2 className="font-mono text-xs font-bold uppercase text-zinc-900">Assign {roleAssignment.role} profile</h2>
              <p className="text-2xs font-mono text-zinc-500 mt-1">{roleAssignment.user.name} · {roleAssignment.user.userId}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {roleAssignment.role === 'STUDENT' && <>
                <label className="form-label">STUDENT ID<input required value={roleAssignment.profile.studentId} onChange={(e) => setRoleAssignment({ ...roleAssignment, profile: { ...roleAssignment.profile, studentId: e.target.value } })} className="form-input mt-1 text-xs font-mono" /></label>
                <label className="form-label">ROLL NUMBER<input required value={roleAssignment.profile.rollNumber} onChange={(e) => setRoleAssignment({ ...roleAssignment, profile: { ...roleAssignment.profile, rollNumber: e.target.value.toUpperCase() } })} className="form-input mt-1 text-xs font-mono" /></label>
                <label className="form-label">HOSTEL<select required value={roleAssignment.profile.hostelId} onChange={(e) => setRoleAssignment({ ...roleAssignment, profile: { ...roleAssignment.profile, hostelId: e.target.value } })} className="form-input mt-1 text-xs font-mono"><option value="">Select hostel</option>{['BH1','BH2','BH3','BH4','BH5','GH'].map((id) => <option key={id} value={id}>{id}</option>)}</select></label>
                <label className="form-label">ROOM<input required value={roleAssignment.profile.roomNumber} onChange={(e) => setRoleAssignment({ ...roleAssignment, profile: { ...roleAssignment.profile, roomNumber: e.target.value } })} className="form-input mt-1 text-xs font-mono" /></label>
              </>}
              {roleAssignment.role === 'GUARD' && <>
                <label className="form-label">GUARD ID<input required value={roleAssignment.profile.guardId} onChange={(e) => setRoleAssignment({ ...roleAssignment, profile: { ...roleAssignment.profile, guardId: e.target.value } })} className="form-input mt-1 text-xs font-mono" /></label>
                <label className="form-label">ASSIGNED HOSTEL<select required value={roleAssignment.profile.assignedHostelId} onChange={(e) => setRoleAssignment({ ...roleAssignment, profile: { ...roleAssignment.profile, assignedHostelId: e.target.value } })} className="form-input mt-1 text-xs font-mono"><option value="">Select hostel</option>{['BH1','BH2','BH3','BH4','BH5','GH'].map((id) => <option key={id} value={id}>{id}</option>)}</select></label>
              </>}
              {roleAssignment.role === 'WARDEN' && <>
                <label className="form-label">WARDEN ID<input required value={roleAssignment.profile.wardenId} onChange={(e) => setRoleAssignment({ ...roleAssignment, profile: { ...roleAssignment.profile, wardenId: e.target.value } })} className="form-input mt-1 text-xs font-mono" /></label>
                <label className="form-label">ASSIGNED HOSTEL<select required value={roleAssignment.profile.assignedHostelId} onChange={(e) => setRoleAssignment({ ...roleAssignment, profile: { ...roleAssignment.profile, assignedHostelId: e.target.value } })} className="form-input mt-1 text-xs font-mono"><option value="">Select hostel</option>{['BH1','BH2','BH3','BH4','BH5','GH'].map((id) => <option key={id} value={id}>{id}</option>)}</select></label>
              </>}
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200">
              <button type="button" onClick={() => setRoleAssignment(null)} className="px-4 py-2 bg-zinc-100 text-zinc-700 rounded text-xs font-mono">CANCEL</button>
              <button type="submit" className="px-4 py-2 bg-accent text-white rounded text-xs font-mono font-semibold">SAVE ROLE</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
