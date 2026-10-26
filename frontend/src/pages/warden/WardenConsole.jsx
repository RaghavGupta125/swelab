import React, { useState, useEffect } from 'react';
import { api } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { OverstayAlertBanner } from '../../components/OverstayAlertBanner.jsx';
import {
  ShieldAlert,
  Building2,
  Users,
  Clock,
  Search,
  Filter,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  UserX,
  Briefcase,
  RefreshCw,
  Calendar,
  Phone,
  Home
} from 'lucide-react';

export const WardenConsole = () => {
  const { user } = useAuth();
  const defaultHostel = user?.profile?.assignedHostelId || 'BH1';

  const [selectedHostel, setSelectedHostel] = useState(defaultHostel);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('LIVE'); // 'LIVE' | 'HISTORY' | 'REPORTS' | 'STUDENTS' | 'WORKERS'

  // Overstay Acknowledgment Modal
  const [ackAlertModal, setAckAlertModal] = useState(null);
  const [ackNotes, setAckNotes] = useState('');
  const [acking, setAcking] = useState(false);

  // History Search State
  const [historyParams, setHistoryParams] = useState({
    studentRollNumber: '',
    visitorName: '',
    guardId: '',
    startDate: '',
    endDate: '',
    overstayOnly: false
  });
  const [historyResults, setHistoryResults] = useState([]);
  const [searchingHistory, setSearchingHistory] = useState(false);

  // Daily Report State
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyReportData, setDailyReportData] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Student Disciplinary Status Update
  const [studentSearchRoll, setStudentSearchRoll] = useState('');
  const [studentActionMsg, setStudentActionMsg] = useState('');

  // Worker registration modal
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [workerForm, setWorkerForm] = useState({
    name: '',
    phoneNumber: '',
    workerType: 'PERMANENT',
    department: 'Housekeeping'
  });

  useEffect(() => {
    loadWardenDashboard();
    const interval = setInterval(loadWardenDashboard, 20000);
    return () => clearInterval(interval);
  }, [selectedHostel]);

  const loadWardenDashboard = async () => {
    try {
      const res = await api.getWardenDashboard(selectedHostel);
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.warn('Failed to load warden dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlert = async (e) => {
    e.preventDefault();
    if (!ackAlertModal) return;
    setAcking(true);
    try {
      await api.acknowledgeAlert(ackAlertModal.alertId, ackNotes);
      setAckAlertModal(null);
      setAckNotes('');
      loadWardenDashboard();
    } catch (err) {
      alert(err.message || 'Failed to acknowledge alert.');
    } finally {
      setAcking(false);
    }
  };

  const handleSearchHistory = async (e) => {
    if (e) e.preventDefault();
    setSearchingHistory(true);
    try {
      const res = await api.getHistoricalVisits({
        hostelId: selectedHostel,
        ...historyParams
      });
      if (res.success && res.data) {
        setHistoryResults(res.data.records || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingHistory(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await api.getDailyReport({ hostelId: selectedHostel, date: reportDate });
      if (res.success) {
        setDailyReportData(res.report);
      }
    } catch (err) {
      alert(err.message || 'Failed to generate report.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleStudentStatusChange = async (newStatus) => {
    if (!studentSearchRoll.trim()) return;
    setStudentActionMsg('');
    try {
      const res = await api.updateStudentStatus(studentSearchRoll.trim(), newStatus);
      setStudentActionMsg(res.message);
    } catch (err) {
      setStudentActionMsg(`Error: ${err.message}`);
    }
  };

  const handleRegisterWorker = async (e) => {
    e.preventDefault();
    try {
      await api.registerWorker({
        ...workerForm,
        assignedHostelId: selectedHostel
      });
      setIsWorkerModalOpen(false);
      setWorkerForm({ name: '', phoneNumber: '', workerType: 'PERMANENT', department: 'Housekeeping' });
      loadWardenDashboard();
    } catch (err) {
      alert(err.message || 'Failed to register worker.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Banner & Hostel Selector */}
      <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl p-5 mb-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-950 text-blue-400 border border-blue-800">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-lg font-bold text-white tracking-wide">
                HOSTEL WARDEN OPERATIONS CENTER
              </h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700">
                {selectedHostel}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Warden: <strong className="text-slate-200">{user?.name}</strong> · LNMIIT Residential Security
            </p>
          </div>
        </div>

        {/* Hostel Filter Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-slate-400 uppercase">Hostel Block:</label>
          <select
            value={selectedHostel}
            onChange={(e) => setSelectedHostel(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-blue-500"
          >
            {['BH1', 'BH2', 'BH3', 'BH4', 'BH5', 'GH'].map((h) => (
              <option key={h} value={h}>{h} ({h === 'GH' ? 'Girls Hostel' : `Boys Hostel ${h.slice(-1)}`})</option>
            ))}
          </select>

          <button
            onClick={loadWardenDashboard}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Critical Overstay Alert Banner if any open alerts */}
      <OverstayAlertBanner
        overstays={dashboardData?.overstayAlerts || []}
        onAction={() => setActiveTab('LIVE')}
      />

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('LIVE')}
          className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
            activeTab === 'LIVE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Live Occupancy & Overstays</span>
          {dashboardData?.openOverstayAlertsCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full">
              {dashboardData.openOverstayAlertsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('HISTORY');
            handleSearchHistory();
          }}
          className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
            activeTab === 'HISTORY' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Search Visit History (FR-049)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('REPORTS');
            handleGenerateReport();
          }}
          className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
            activeTab === 'REPORTS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Daily Traffic Audit (FR-051)</span>
        </button>

        <button
          onClick={() => setActiveTab('STUDENTS')}
          className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
            activeTab === 'STUDENTS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <UserX className="w-4 h-4" />
          <span>Disciplinary Status</span>
        </button>

        <button
          onClick={() => setActiveTab('WORKERS')}
          className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
            activeTab === 'WORKERS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Staff Registry</span>
        </button>
      </div>

      {/* Tab 1: Live Occupancy & Alerts */}
      {activeTab === 'LIVE' && (
        <div className="space-y-6">
          {/* Key Operational KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl p-4 shadow">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Active Inside Visitors</span>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {dashboardData?.activeVisitorsCount || 0}
              </div>
              <span className="text-[10px] text-slate-500">Currently within {selectedHostel}</span>
            </div>

            <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl p-4 shadow">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Overstay Violations</span>
              <div className={`text-2xl font-bold font-mono mt-1 ${dashboardData?.openOverstayAlertsCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {dashboardData?.openOverstayAlertsCount || 0}
              </div>
              <span className="text-[10px] text-slate-500">Exceeded permitted departure</span>
            </div>

            <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl p-4 shadow">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Guards On Duty</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {dashboardData?.activeGuardsOnDuty?.length || 0}
              </div>
              <span className="text-[10px] text-slate-500">Active shift attendance logged</span>
            </div>

            <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl p-4 shadow">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Daily Gate Traffic</span>
              <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
                {dashboardData?.dailySummary?.totalEntries || 0}
              </div>
              <span className="text-[10px] text-slate-500">Total entries recorded today</span>
            </div>
          </div>

          {/* Active Overstay Alerts Table (FR-039, FR-040) */}
          <div className="bg-hg-slate-900 border border-red-900/50 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-red-950/40 border-b border-red-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h3 className="font-bold text-red-200 text-sm">
                  Active Overstay Alerts Queue ({dashboardData?.overstayAlerts?.length || 0})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-red-300">Auto-calculated past 19:00 or scheduled exit</span>
            </div>

            <div className="divide-y divide-slate-800">
              {dashboardData?.overstayAlerts?.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                  <span>No active overstay violations in {selectedHostel}.</span>
                </div>
              ) : (
                dashboardData.overstayAlerts.map((alt) => (
                  <div key={alt.alertId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-red-950/20 hover:bg-red-950/30 transition">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-sm">{alt.visitorName}</span>
                        <StatusBadge status="OVERSTAY" />
                        <span className="font-mono text-xs text-slate-400">Host: <strong className="text-blue-400">{alt.studentRollNumber}</strong></span>
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-4">
                        <span>Expected Exit: <strong className="text-red-300">{new Date(alt.expectedExitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                        <span>Detected At: {new Date(alt.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setAckAlertModal(alt)}
                      className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold self-start sm:self-center transition shadow"
                    >
                      Acknowledge & Record Action
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Visitors Table */}
          <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">
                Visitors Currently Inside {selectedHostel} ({dashboardData?.activeVisitors?.length || 0})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Visitor Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Host Student</th>
                    <th className="p-3">Entry Time</th>
                    <th className="p-3">Expected Exit</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {dashboardData?.activeVisitors?.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-6 text-center text-slate-500">No visitors currently inside.</td>
                    </tr>
                  ) : (
                    dashboardData.activeVisitors.map((v) => (
                      <tr key={v.visitId} className={v.overstayStatus ? 'bg-red-950/20' : 'hover:bg-slate-850/40'}>
                        <td className="p-3 font-semibold text-white">{v.visitorName} ({v.totalVisitorCount})</td>
                        <td className="p-3 font-mono">{v.visitorPhone}</td>
                        <td className="p-3 font-mono text-blue-400 font-semibold">{v.hostStudentRollNumber}</td>
                        <td className="p-3 font-mono">{new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="p-3 font-mono text-slate-400">{new Date(v.expectedExitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="p-3">{v.overstayStatus ? <StatusBadge status="OVERSTAY" /> : <StatusBadge status="ACTIVE" />}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Historical Visit Query (FR-049, FR-050) */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-6">
          <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl p-5 shadow-xl">
            <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-400" />
              <span>Multi-Criteria Historical Visit Search</span>
            </h3>

            <form onSubmit={handleSearchHistory} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Host Roll No.</label>
                <input
                  type="text"
                  placeholder="e.g. 24UCS049"
                  value={historyParams.studentRollNumber}
                  onChange={(e) => setHistoryParams({ ...historyParams, studentRollNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Visitor Name</label>
                <input
                  type="text"
                  placeholder="Visitor name"
                  value={historyParams.visitorName}
                  onChange={(e) => setHistoryParams({ ...historyParams, visitorName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Guard ID</label>
                <input
                  type="text"
                  placeholder="e.g. G012"
                  value={historyParams.guardId}
                  onChange={(e) => setHistoryParams({ ...historyParams, guardId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={historyParams.startDate}
                  onChange={(e) => setHistoryParams({ ...historyParams, startDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={historyParams.endDate}
                  onChange={(e) => setHistoryParams({ ...historyParams, endDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={searchingHistory}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
              </div>
            </form>
          </div>

          {/* Results Table */}
          <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3">Visit ID</th>
                    <th className="p-3">Visitor</th>
                    <th className="p-3">Host Roll</th>
                    <th className="p-3">Entry Time</th>
                    <th className="p-3">Exit Time</th>
                    <th className="p-3">Duration</th>
                    <th className="p-3">Guard</th>
                    <th className="p-3">Overstay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {historyResults.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-6 text-center text-slate-500">No visit records matching query.</td>
                    </tr>
                  ) : (
                    historyResults.map((rec) => (
                      <tr key={rec.visitId} className="hover:bg-slate-850/40">
                        <td className="p-3 font-mono text-slate-400">{rec.visitId}</td>
                        <td className="p-3 font-semibold text-white">{rec.visitorName}</td>
                        <td className="p-3 font-mono text-blue-400">{rec.hostStudentRollNumber}</td>
                        <td className="p-3 font-mono">{new Date(rec.entryTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td className="p-3 font-mono">{rec.exitTime ? new Date(rec.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}</td>
                        <td className="p-3">{rec.stayDurationMinutes ? `${rec.stayDurationMinutes} mins` : '-'}</td>
                        <td className="p-3 font-mono text-slate-400">{rec.guardId}</td>
                        <td className="p-3">{rec.overstayStatus ? <StatusBadge status="OVERSTAY" /> : <span className="text-emerald-400">Normal</span>}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Daily Summary Report (FR-051) */}
      {activeTab === 'REPORTS' && (
        <div className="space-y-6">
          <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl p-5 shadow-xl flex items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-sm">Automated Daily Hostel Traffic Report</h3>
              <p className="text-xs text-slate-400 mt-0.5">Aggregated visitor density and security compliance metrics.</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              />
              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generate</span>
              </button>
            </div>
          </div>

          {dailyReportData && (
            <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white font-mono">
                    DAILY VISITOR AUDIT REPORT · {dailyReportData.hostelId}
                  </h2>
                  <span className="text-xs text-slate-400">Date: {dailyReportData.reportDate}</span>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
                >
                  Print / Export Summary
                </button>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-slate-500">Total Gate Entries</span>
                  <div className="text-2xl font-bold font-mono text-white mt-1">
                    {dailyReportData.summary.totalEntries}
                  </div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-slate-500">Total Check-Outs</span>
                  <div className="text-2xl font-bold font-mono text-white mt-1">
                    {dailyReportData.summary.totalExits}
                  </div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-slate-500">Overstay Violations</span>
                  <div className="text-2xl font-bold font-mono text-red-400 mt-1">
                    {dailyReportData.summary.overstayCount}
                  </div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-slate-500">Approved Requests</span>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                    {dailyReportData.summary.approvedRequests}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Student Disciplinary Status (FR-006, BR-002) */}
      {activeTab === 'STUDENTS' && (
        <div className="bg-hg-slate-900 border border-hg-slate-800 rounded-xl p-6 shadow-xl space-y-4 max-w-xl">
          <h3 className="font-bold text-white text-base">Host Student Disciplinary Status Management</h3>
          <p className="text-xs text-slate-400">
            Enforce BR-002: Blocked students are strictly prohibited from receiving or approving visitor requests.
          </p>

          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1">Student Roll Number</label>
              <input
                type="text"
                placeholder="e.g. 24UCS049"
                value={studentSearchRoll}
                onChange={(e) => setStudentSearchRoll(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white uppercase"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleStudentStatusChange('ACTIVE')}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
              >
                Set ACTIVE
              </button>
              <button
                type="button"
                onClick={() => handleStudentStatusChange('INACTIVE')}
                className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition"
              >
                Set INACTIVE
              </button>
              <button
                type="button"
                onClick={() => handleStudentStatusChange('BLOCKED')}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition"
              >
                BLOCK STUDENT (BR-002)
              </button>
            </div>

            {studentActionMsg && (
              <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-blue-400 font-mono">
                {studentActionMsg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Worker Registry */}
      {activeTab === 'WORKERS' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-sm">Campus Maintenance Staff Registry · {selectedHostel}</h3>
            <button
              onClick={() => setIsWorkerModalOpen(true)}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
            >
              + Register New Worker
            </button>
          </div>
        </div>
      )}

      {/* Acknowledge Alert Modal */}
      {ackAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl p-6 shadow-2xl">
            <h3 className="font-bold text-white text-base mb-2">Acknowledge Overstay Incident</h3>
            <p className="text-xs text-slate-400 mb-4">
              Visitor <strong>{ackAlertModal.visitorName}</strong> hosted by student <strong>{ackAlertModal.studentRollNumber}</strong> exceeded their visit duration.
            </p>
            <form onSubmit={handleAcknowledgeAlert}>
              <textarea
                rows="3"
                value={ackNotes}
                onChange={(e) => setAckNotes(e.target.value)}
                placeholder="Enter resolution notes (e.g., Gate security dispatched to Room B-201, student notified)."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 mb-4"
              ></textarea>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAckAlertModal(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={acking}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
                >
                  {acking ? 'Acknowledging...' : 'Acknowledge Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Worker Modal */}
      {isWorkerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl p-6 shadow-2xl">
            <h3 className="font-bold text-white text-base mb-2">Register Maintenance Staff</h3>
            <form onSubmit={handleRegisterWorker} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={workerForm.name}
                  onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={workerForm.phoneNumber}
                  onChange={(e) => setWorkerForm({ ...workerForm, phoneNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Worker Category (FR-047)</label>
                <select
                  value={workerForm.workerType}
                  onChange={(e) => setWorkerForm({ ...workerForm, workerType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="PERMANENT">PERMANENT</option>
                  <option value="CONTRACT">CONTRACT</option>
                  <option value="DAILY">DAILY</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={workerForm.department}
                  onChange={(e) => setWorkerForm({ ...workerForm, department: e.target.value })}
                  placeholder="e.g. Electrical / Housekeeping"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWorkerModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
                >
                  Register Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
