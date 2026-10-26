import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import {
  Shield,
  Users,
  Building,
  Activity,
  UserCheck,
  UserX,
  Search,
  Filter,
  RefreshCw,
  Key
} from 'lucide-react';

export const AdminConsole = () => {
  const [overview, setOverview] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('USERS'); // 'USERS' | 'AUDIT' | 'HOSTELS'

  // User search/filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadOverview();
    loadUsers();
    loadAuditLogs();
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

  const handleAssignRole = async (userId, newRole) => {
    try {
      await api.assignUserRole(userId, newRole);
      loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to assign role.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Overview Stats Bar */}
      <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl p-5 mb-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-950 text-purple-400 border border-purple-800">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-mono text-lg font-bold text-white tracking-wide">
              SYSTEM SECURITY ADMINISTRATION
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">LNMIIT HostGuard Platform Authority</p>
          </div>
        </div>

        {/* Global Key Metrics */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase text-[10px] block">Total Users</span>
            <span className="text-white font-bold">{overview?.totalUsers || 0}</span>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase text-[10px] block">Active Visitors</span>
            <span className="text-emerald-400 font-bold">{overview?.activeVisitsTotal || 0}</span>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-500 uppercase text-[10px] block">Overstays</span>
            <span className="text-red-400 font-bold">{overview?.overstayVisitsTotal || 0}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
            activeTab === 'USERS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User & RBAC Management (FR-004, FR-006)</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
            activeTab === 'AUDIT' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Security Audit Trail (NFR-020)</span>
        </button>

        <button
          onClick={() => setActiveTab('HOSTELS')}
          className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
            activeTab === 'HOSTELS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Hostel Facilities</span>
        </button>
      </div>

      {/* Tab 1: Users & RBAC */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl p-4 shadow flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, email, or user ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="">All Roles</option>
              <option value="STUDENT">STUDENT</option>
              <option value="GUARD">GUARD</option>
              <option value="WARDEN">WARDEN</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="BLOCKED">BLOCKED</option>
            </select>
            <button
              onClick={loadUsers}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
            >
              Apply Filter
            </button>
          </div>

          {/* User Table */}
          <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">User ID</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role (FR-004)</th>
                    <th className="p-3">Status (FR-006)</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {usersList.map((u) => (
                    <tr key={u.userId} className="hover:bg-slate-850/40">
                      <td className="p-3 font-mono text-blue-400 font-semibold">{u.userId}</td>
                      <td className="p-3 font-semibold text-white">{u.name}</td>
                      <td className="p-3 font-mono text-slate-400">{u.email}</td>
                      <td className="p-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleAssignRole(u.userId, e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono text-white"
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
                        {u.accountStatus === 'ACTIVE' ? (
                          <button
                            onClick={() => handleUpdateStatus(u.userId, 'BLOCKED')}
                            className="px-2.5 py-1 rounded bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-[11px] font-semibold transition"
                          >
                            Block
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(u.userId, 'ACTIVE')}
                            className="px-2.5 py-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[11px] font-semibold transition"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Security Audit Logs (NFR-020) */}
      {activeTab === 'AUDIT' && (
        <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {auditLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-850/40">
                    <td className="p-3 font-mono text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 font-mono text-blue-400 font-semibold">{log.action}</td>
                    <td className="p-3 text-white">{log.performedBy?.name || 'System'}</td>
                    <td className="p-3 font-mono text-slate-400">{log.performedBy?.role || '-'}</td>
                    <td className="p-3 font-mono text-slate-400 truncate max-w-xs">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Hostels */}
      {activeTab === 'HOSTELS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {overview?.hostels?.map((h) => (
            <div key={h.hostelId} className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl p-5 shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-lg font-bold text-white">{h.hostelId}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  {h.type}
                </span>
              </div>
              <h4 className="font-semibold text-slate-200 text-sm">{h.hostelName}</h4>
              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                <span>Active Inside Visitors:</span>
                <strong className="text-emerald-400 font-mono">{h.activeVisitorsCount}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
