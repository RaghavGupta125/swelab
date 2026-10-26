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
  FileSpreadsheet,
  AlertTriangle,
  UserX,
  Briefcase,
  RefreshCw,
  X,
  Plus,
  ArrowRight,
  Filter,
} from 'lucide-react';

const NAV_TABS = [
  { id: 'LIVE', label: 'Live Operations', icon: Building2 },
  { id: 'HISTORY', label: 'Historical Visits', icon: Clock },
  { id: 'REPORTS', label: 'Daily Analytics', icon: FileSpreadsheet },
  { id: 'STUDENTS', label: 'Discipline & Status', icon: UserX },
  { id: 'WORKERS', label: 'Staff Registry', icon: Briefcase },
];

export const WardenConsole = () => {
  const { user } = useAuth();
  const defaultHostel = user?.profile?.assignedHostelId || 'BH1';

  const [selectedHostel, setSelectedHostel] = useState(defaultHostel);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('LIVE');

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
    overstayOnly: false,
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
    department: 'Housekeeping',
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
        ...historyParams,
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
        assignedHostelId: selectedHostel,
      });
      setIsWorkerModalOpen(false);
      setWorkerForm({ name: '', phoneNumber: '', workerType: 'PERMANENT', department: 'Housekeeping' });
      loadWardenDashboard();
    } catch (err) {
      alert(err.message || 'Failed to register worker.');
    }
  };

  const overstayAlerts = dashboardData?.overstayAlerts || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner / Hostel Selector */}
      <div className="bg-[#111115] border border-white/[0.08] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-base font-bold text-zinc-100 uppercase tracking-tight">
              HOSTEL WARDEN OPERATIONS CENTER
            </h1>
            <span className="text-2xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              {selectedHostel} SECTOR
            </span>
          </div>
          <div className="text-2xs font-mono text-zinc-500 mt-0.5">
            WARDEN: {user?.name} · REAL-TIME FACILITY OVERSIGHT & DISCIPLINARY LOGS
          </div>
        </div>

        {/* Hostel Selector */}
        <div className="flex items-center gap-3">
          <label className="text-2xs font-mono text-zinc-400 uppercase">ZONE SECTOR:</label>
          <select
            value={selectedHostel}
            onChange={(e) => setSelectedHostel(e.target.value)}
            className="bg-base border border-white/[0.1] rounded px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-accent"
          >
            <option value="BH1">BH1 (Boys Hostel 1)</option>
            <option value="BH2">BH2 (Boys Hostel 2)</option>
            <option value="BH3">BH3 (Boys Hostel 3)</option>
            <option value="GH">GH (Girls Hostel)</option>
          </select>
          <button
            onClick={loadWardenDashboard}
            className="p-1.5 rounded bg-base hover:bg-white/[0.05] border border-white/[0.08] text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-accent' : ''}`} />
          </button>
        </div>
      </div>

      {/* Incident Banner if any overstays */}
      <OverstayAlertBanner
        overstays={overstayAlerts}
        onAction={() => setActiveTab('LIVE')}
      />

      {/* Studio Workspace Layout: Sidebar + Main Stage */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Sidebar Nav (3 cols) */}
        <div className="md:col-span-3 space-y-1">
          <div className="text-2xs font-mono uppercase tracking-wider text-zinc-500 px-3 py-1 mb-1">
            CONTROL DOMAINS
          </div>
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded text-xs font-mono font-medium transition-colors text-left ${
                  active
                    ? 'bg-accent/15 text-accent border border-accent/30 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.id === 'LIVE' && overstayAlerts.length > 0 && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-status-red animate-pulse-subtle" />
                )}
              </button>
            );
          })}
        </div>

        {/* Main Workspace Stage (9 cols) */}
        <div className="md:col-span-9 space-y-6">

          {/* TAB 1: LIVE OPERATIONS */}
          {activeTab === 'LIVE' && (
            <div className="space-y-6">
              
              {/* 2x2 Metric Cards Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 bg-[#111115] border border-white/[0.08] rounded-lg">
                  <div className="text-2xs font-mono text-zinc-500 uppercase">ACTIVE INSIDE</div>
                  <div className="text-2xl font-mono font-bold text-zinc-100 mt-1">
                    {dashboardData?.occupancy?.currentlyInsideVisitors || 0}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-1">PEOPLE AT GATE</div>
                </div>

                <div className="p-4 bg-[#111115] border border-white/[0.08] rounded-lg">
                  <div className="text-2xs font-mono text-zinc-500 uppercase">OVERSTAY INCIDENTS</div>
                  <div
                    className={`text-2xl font-mono font-bold mt-1 ${
                      overstayAlerts.length > 0 ? 'text-status-red' : 'text-zinc-100'
                    }`}
                  >
                    {overstayAlerts.length}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-1">PAST EXIT WINDOW</div>
                </div>

                <div className="p-4 bg-[#111115] border border-white/[0.08] rounded-lg">
                  <div className="text-2xs font-mono text-zinc-500 uppercase">ON-DUTY GUARDS</div>
                  <div className="text-2xl font-mono font-bold text-status-green mt-1">
                    {dashboardData?.activeGuards?.length || 0}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-1">ACTIVE SHIFTS</div>
                </div>

                <div className="p-4 bg-[#111115] border border-white/[0.08] rounded-lg">
                  <div className="text-2xs font-mono text-zinc-500 uppercase">TODAY'S ADMISSIONS</div>
                  <div className="text-2xl font-mono font-bold text-zinc-100 mt-1">
                    {dashboardData?.occupancy?.totalTodayVisits || 0}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500 mt-1">COMPLETED ENTRIES</div>
                </div>
              </div>

              {/* Overstay Alert Queue */}
              {overstayAlerts.length > 0 && (
                <div className="bg-[#111115] border border-status-redBorder rounded-lg p-5 space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-status-redBorder/40">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-status-red animate-pulse-subtle" />
                      <span className="text-2xs font-mono font-bold uppercase tracking-wider text-status-red">
                        ACTIVE OVERSTAY INCIDENT QUEUE (BR-010)
                      </span>
                    </div>
                    <span className="text-2xs font-mono text-status-red">ACTION REQUIRED</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-2xs font-mono">
                      <thead>
                        <tr className="border-b border-white/[0.06] text-zinc-500">
                          <th className="p-2.5">ALERT ID</th>
                          <th className="p-2.5">VISITOR NAME</th>
                          <th className="p-2.5">HOST ROLL</th>
                          <th className="p-2.5">EXPECTED OUT</th>
                          <th className="p-2.5">SEVERITY</th>
                          <th className="p-2.5 text-right">ACTION</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {overstayAlerts.map((alt) => (
                          <tr key={alt.alertId} className="hover:bg-white/[0.02]">
                            <td className="p-2.5 text-status-red font-bold">{alt.alertId}</td>
                            <td className="p-2.5 text-zinc-200 font-semibold">{alt.visitorName}</td>
                            <td className="p-2.5 text-blue-400">{alt.hostStudentRollNumber}</td>
                            <td className="p-2.5 text-zinc-400">
                              {new Date(alt.expectedExitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-2.5">
                              <span className="px-1.5 py-0.5 rounded bg-status-redBg border border-status-redBorder text-status-red font-bold">
                                CRITICAL
                              </span>
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                onClick={() => {
                                  setAckAlertModal(alt);
                                  setAckNotes('');
                                }}
                                className="px-2.5 py-1 bg-status-red hover:bg-red-600 text-white rounded text-2xs font-bold transition-colors"
                              >
                                ACKNOWLEDGE
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Active Inside Visitors Table */}
              <div className="bg-[#111115] border border-white/[0.08] rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                  <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400">
                    VISITORS PRESENTLY OCCUPYING {selectedHostel}
                  </span>
                  <span className="text-2xs font-mono text-zinc-600">FR-039</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-2xs font-mono">
                    <thead>
                      <tr className="border-b border-white/[0.06] text-zinc-500">
                        <th className="p-2.5">VISIT ID</th>
                        <th className="p-2.5">VISITOR</th>
                        <th className="p-2.5">HOST ROLL</th>
                        <th className="p-2.5">ENTRY TIME</th>
                        <th className="p-2.5">EXPECTED EXIT</th>
                        <th className="p-2.5">STATE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {(!dashboardData?.activeInsideVisitors || dashboardData.activeInsideVisitors.length === 0) ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-zinc-600">
                            NO REGISTERED GUESTS CURRENTLY INSIDE SECTOR
                          </td>
                        </tr>
                      ) : (
                        dashboardData.activeInsideVisitors.map((rec) => (
                          <tr key={rec.visitId} className="hover:bg-white/[0.02]">
                            <td className="p-2.5 text-zinc-400">{rec.visitId}</td>
                            <td className="p-2.5">
                              <div className="text-zinc-200 font-semibold">{rec.visitorName}</div>
                              <div className="text-zinc-500 text-[10px]">{rec.visitorPhone}</div>
                            </td>
                            <td className="p-2.5 text-blue-400">{rec.hostStudentRollNumber}</td>
                            <td className="p-2.5 text-zinc-300">
                              {new Date(rec.actualEntryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-2.5 text-zinc-300">
                              {new Date(rec.expectedExitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="p-2.5">
                              <StatusBadge status={rec.overstayStatus ? 'OVERSTAY' : 'ACTIVE'} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: HISTORICAL VISITS */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-4">
              <div className="bg-[#111115] border border-white/[0.08] rounded-lg p-5">
                <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400 block mb-3">
                  PARAMETRIC SEARCH ARCHIVE (FR-040)
                </span>

                <form onSubmit={handleSearchHistory} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="form-label">STUDENT ROLL NUMBER</label>
                    <input
                      type="text"
                      placeholder="e.g. 24UCS049"
                      value={historyParams.studentRollNumber}
                      onChange={(e) => setHistoryParams({ ...historyParams, studentRollNumber: e.target.value })}
                      className="form-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="form-label">VISITOR NAME</label>
                    <input
                      type="text"
                      placeholder="e.g. Sharma"
                      value={historyParams.visitorName}
                      onChange={(e) => setHistoryParams({ ...historyParams, visitorName: e.target.value })}
                      className="form-input text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="form-label">START DATE</label>
                    <input
                      type="date"
                      value={historyParams.startDate}
                      onChange={(e) => setHistoryParams({ ...historyParams, startDate: e.target.value })}
                      className="form-input text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-2 pt-2">
                    <label className="flex items-center gap-2 text-2xs font-mono text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={historyParams.overstayOnly}
                        onChange={(e) => setHistoryParams({ ...historyParams, overstayOnly: e.target.checked })}
                        className="rounded border-white/20 bg-base text-accent"
                      />
                      <span>OVERSTAY VIOLATIONS ONLY</span>
                    </label>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={searchingHistory}
                      className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-mono font-semibold rounded inline-flex items-center gap-2 transition-colors"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{searchingHistory ? 'SEARCHING...' : 'RUN QUERY'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Results Table */}
              <div className="bg-[#111115] border border-white/[0.08] rounded-lg overflow-x-auto">
                <table className="w-full text-left text-2xs font-mono">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-zinc-500 bg-base">
                      <th className="p-3">VISIT ID</th>
                      <th className="p-3">VISITOR</th>
                      <th className="p-3">HOST ROLL</th>
                      <th className="p-3">ENTRY</th>
                      <th className="p-3">EXIT</th>
                      <th className="p-3">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {historyResults.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-600">
                          ENTER QUERY PARAMETERS OR EXECUTE SEARCH TO VIEW LOGS
                        </td>
                      </tr>
                    ) : (
                      historyResults.map((r) => (
                        <tr key={r.visitId} className="hover:bg-white/[0.02]">
                          <td className="p-3 text-zinc-400 font-bold">{r.visitId}</td>
                          <td className="p-3 text-zinc-200">{r.visitorName}</td>
                          <td className="p-3 text-blue-400">{r.hostStudentRollNumber}</td>
                          <td className="p-3 text-zinc-300">{new Date(r.actualEntryTime).toLocaleString()}</td>
                          <td className="p-3 text-zinc-300">
                            {r.actualExitTime ? new Date(r.actualExitTime).toLocaleString() : 'STILL INSIDE'}
                          </td>
                          <td className="p-3">
                            <StatusBadge status={r.overstayStatus ? 'OVERSTAY' : (r.actualExitTime ? 'CONSUMED' : 'ACTIVE')} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DAILY ANALYTICS / REPORTS */}
          {activeTab === 'REPORTS' && (
            <div className="space-y-4">
              <div className="bg-[#111115] border border-white/[0.08] rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400 block">
                    DAILY AUDIT & SUMMARY REPORT (FR-043)
                  </span>
                  <div className="text-2xs font-mono text-zinc-500 mt-0.5">
                    GENERATE VERIFIED ACCESS METRICS FOR SELECTED DATE
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="bg-base border border-white/[0.1] rounded px-3 py-1.5 text-xs font-mono text-zinc-200"
                  />
                  <button
                    onClick={handleGenerateReport}
                    disabled={generatingReport}
                    className="px-4 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-mono font-semibold rounded inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>{generatingReport ? 'COMPILING...' : 'GENERATE'}</span>
                  </button>
                </div>
              </div>

              {dailyReportData && (
                <div className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 bg-[#111115] border border-white/[0.08] rounded-lg">
                      <div className="text-2xs font-mono text-zinc-500">TOTAL VISITS</div>
                      <div className="text-xl font-mono font-bold text-zinc-100 mt-1">
                        {dailyReportData.summary?.totalVisits || 0}
                      </div>
                    </div>
                    <div className="p-4 bg-[#111115] border border-white/[0.08] rounded-lg">
                      <div className="text-2xs font-mono text-zinc-500">TOTAL INDIVIDUALS</div>
                      <div className="text-xl font-mono font-bold text-zinc-100 mt-1">
                        {dailyReportData.summary?.totalVisitorsCount || 0}
                      </div>
                    </div>
                    <div className="p-4 bg-[#111115] border border-white/[0.08] rounded-lg">
                      <div className="text-2xs font-mono text-zinc-500">OVERSTAYS</div>
                      <div className="text-xl font-mono font-bold text-status-red mt-1">
                        {dailyReportData.summary?.overstayCount || 0}
                      </div>
                    </div>
                    <div className="p-4 bg-[#111115] border border-white/[0.08] rounded-lg">
                      <div className="text-2xs font-mono text-zinc-500">AVG DURATION</div>
                      <div className="text-xl font-mono font-bold text-zinc-100 mt-1">
                        {dailyReportData.summary?.averageDurationMinutes || 0}m
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STUDENT DISCIPLINARY STATUS */}
          {activeTab === 'STUDENTS' && (
            <div className="bg-[#111115] border border-white/[0.08] rounded-lg p-5 space-y-4">
              <div>
                <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400 block">
                  STUDENT DISCIPLINARY STATUS MANAGEMENT (BR-002)
                </span>
                <p className="text-2xs font-mono text-zinc-500 mt-0.5">
                  Blocked or suspended students cannot approve visitor requests or host campus guests.
                </p>
              </div>

              <div className="max-w-md space-y-3 pt-2">
                <div>
                  <label className="form-label">STUDENT ROLL NUMBER</label>
                  <input
                    type="text"
                    placeholder="e.g. 24UCS049"
                    value={studentSearchRoll}
                    onChange={(e) => setStudentSearchRoll(e.target.value)}
                    className="form-input text-xs font-mono"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => handleStudentStatusChange('ACTIVE')}
                    className="flex-1 py-2 bg-status-green hover:bg-green-600 text-black text-2xs font-mono font-bold rounded transition-colors"
                  >
                    SET ACTIVE
                  </button>
                  <button
                    onClick={() => handleStudentStatusChange('SUSPENDED')}
                    className="flex-1 py-2 bg-status-amberBg hover:bg-status-amber text-status-amber hover:text-black border border-status-amberBorder text-2xs font-mono font-bold rounded transition-colors"
                  >
                    SET SUSPENDED
                  </button>
                  <button
                    onClick={() => handleStudentStatusChange('BLOCKED')}
                    className="flex-1 py-2 bg-status-redBg hover:bg-status-red text-status-red hover:text-white border border-status-redBorder text-2xs font-mono font-bold rounded transition-colors"
                  >
                    BLOCK HOST
                  </button>
                </div>

                {studentActionMsg && (
                  <div className="p-2.5 rounded bg-base border border-white/[0.08] text-2xs font-mono text-zinc-300">
                    {studentActionMsg}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: STAFF REGISTRY */}
          {activeTab === 'WORKERS' && (
            <div className="space-y-4">
              <div className="bg-[#111115] border border-white/[0.08] rounded-lg p-5 flex items-center justify-between">
                <div>
                  <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400 block">
                    SERVICE WORKER & CONTRACTOR DIRECTORY (FR-045)
                  </span>
                  <div className="text-2xs font-mono text-zinc-500 mt-0.5">
                    AUTHORIZED MAINTENANCE, ELECTRICAL & HOUSEKEEPING PERSONNEL
                  </div>
                </div>

                <button
                  onClick={() => setIsWorkerModalOpen(true)}
                  className="px-3.5 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-mono font-semibold rounded inline-flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>REGISTER WORKER</span>
                </button>
              </div>

              {/* Workers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(!dashboardData?.workers || dashboardData.workers.length === 0) ? (
                  <div className="col-span-3 p-8 bg-[#111115] border border-white/[0.06] rounded-lg text-center text-2xs font-mono text-zinc-600">
                    NO WORKERS ENROLLED IN SECTOR
                  </div>
                ) : (
                  dashboardData.workers.map((w) => (
                    <div
                      key={w.workerId}
                      className="p-4 bg-[#111115] border border-white/[0.08] rounded-lg flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-2xs font-mono text-zinc-500">{w.workerId}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                            {w.workerType}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-zinc-100 mt-1">{w.fullName}</div>
                        <div className="text-2xs font-mono text-zinc-400">{w.department} · {w.phoneNumber}</div>
                      </div>
                      <div className="pt-2 border-t border-white/[0.05] text-[10px] font-mono">
                        <span className={w.currentlyInside ? 'text-status-green font-bold' : 'text-zinc-500'}>
                          {w.currentlyInside ? '● CURRENTLY INSIDE' : '○ OUTSIDE HOSTEL'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Acknowledge Alert Modal */}
      {ackAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#111115] border border-white/10 rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-base">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-status-red">
                ACKNOWLEDGE OVERSTAY #{ackAlertModal.alertId}
              </span>
              <button onClick={() => setAckAlertModal(null)} className="text-zinc-500 hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAcknowledgeAlert} className="p-5 space-y-4">
              <p className="text-2xs font-mono text-zinc-400">
                Acknowledge overstay incident for visitor <strong className="text-zinc-200">{ackAlertModal.visitorName}</strong>. This logs disciplinary review notes into institutional audit trail (BR-010).
              </p>

              <div>
                <label className="form-label">WARDEN RESOLUTION NOTES</label>
                <textarea
                  rows={3}
                  required
                  value={ackNotes}
                  onChange={(e) => setAckNotes(e.target.value)}
                  placeholder="e.g. Guard dispatched to room B-201. Visitor escorted off premises."
                  className="form-input text-xs font-mono resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setAckAlertModal(null)}
                  className="px-4 py-2 bg-[#252529] hover:bg-[#303036] text-zinc-300 rounded text-xs font-mono font-semibold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={acking}
                  className="px-4 py-2 bg-status-red hover:bg-red-600 text-white rounded text-xs font-mono font-semibold transition-colors disabled:opacity-50"
                >
                  {acking ? 'LOGGING...' : 'ACKNOWLEDGE INCIDENT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Worker Modal */}
      {isWorkerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[#111115] border border-white/10 rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-base">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-200">
                REGISTER SERVICE WORKER
              </span>
              <button onClick={() => setIsWorkerModalOpen(false)} className="text-zinc-500 hover:text-zinc-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterWorker} className="p-5 space-y-4">
              <div>
                <label className="form-label">FULL NAME</label>
                <input
                  type="text"
                  required
                  value={workerForm.name}
                  onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                  placeholder="e.g. Mohan Lal"
                  className="form-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="form-label">PHONE NUMBER</label>
                <input
                  type="tel"
                  required
                  value={workerForm.phoneNumber}
                  onChange={(e) => setWorkerForm({ ...workerForm, phoneNumber: e.target.value })}
                  placeholder="e.g. 9829012345"
                  className="form-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="form-label">WORKER CATEGORY</label>
                <select
                  value={workerForm.workerType}
                  onChange={(e) => setWorkerForm({ ...workerForm, workerType: e.target.value })}
                  className="form-input text-xs font-mono"
                >
                  <option value="PERMANENT">PERMANENT</option>
                  <option value="CONTRACT">CONTRACT</option>
                  <option value="DAILY">DAILY</option>
                </select>
              </div>

              <div>
                <label className="form-label">DEPARTMENT / TRADE</label>
                <input
                  type="text"
                  required
                  value={workerForm.department}
                  onChange={(e) => setWorkerForm({ ...workerForm, department: e.target.value })}
                  placeholder="e.g. Electrical / Housekeeping / Plumbing"
                  className="form-input text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsWorkerModalOpen(false)}
                  className="px-4 py-2 bg-[#252529] hover:bg-[#303036] text-zinc-300 rounded text-xs font-mono font-semibold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded text-xs font-mono font-semibold transition-colors"
                >
                  ENROLL STAFF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
