import { Hostel } from '../models/Hostel.js';
import { VisitRecord } from '../models/VisitRecord.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { User } from '../models/User.js';
import { GuardAttendance } from '../models/GuardAttendance.js';
import { Worker } from '../models/Worker.js';
import {
  checkAndProcessActiveOverstays,
  getOverstayAlerts,
  acknowledgeOverstayAlert
} from '../services/overstayService.js';
import { generateDailyTrafficReport } from '../services/reportService.js';
import { getISTParts } from '../utils/timeUtils.js';
import { AuditLog } from '../models/AuditLog.js';

export const getWardenDashboard = async (req, res, next) => {
  try {
    const hostelId = req.wardenProfile ? req.wardenProfile.assignedHostelId : (req.query.hostelId || 'BH1');

    // Run active overstay scan
    await checkAndProcessActiveOverstays(hostelId);

    const { dateStr } = getISTParts();

    const [
      hostel,
      activeVisitors,
      overstayAlerts,
      dailyReport,
      activeGuards,
      workersCount
    ] = await Promise.all([
      Hostel.findOne({ hostelId }),
      VisitRecord.find({ hostelId, exitTime: null }).sort({ entryTime: -1 }),
      getOverstayAlerts(hostelId, 'OPEN'),
      generateDailyTrafficReport(hostelId, dateStr),
      GuardAttendance.find({ hostelId, date: dateStr, isActive: true }),
      Worker.countDocuments({ assignedHostelId: hostelId })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        hostelId,
        hostelDetails: hostel,
        activeVisitors,
        activeVisitorsCount: activeVisitors.reduce((sum, v) => sum + (v.totalVisitorCount || 1), 0),
        openOverstayAlertsCount: overstayAlerts.length,
        overstayAlerts,
        dailySummary: dailyReport.summary,
        activeGuardsOnDuty: activeGuards,
        workersRegisteredCount: workersCount
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAlerts = async (req, res, next) => {
  try {
    const hostelId = req.wardenProfile ? req.wardenProfile.assignedHostelId : req.query.hostelId;
    const { status } = req.query;
    const alerts = await getOverstayAlerts(hostelId, status);

    return res.status(200).json({
      success: true,
      alerts
    });
  } catch (error) {
    next(error);
  }
};

export const acknowledgeAlert = async (req, res, next) => {
  try {
    const { alertId } = req.params;
    const { notes } = req.body;
    const alert = await acknowledgeOverstayAlert(alertId, req.user, notes);

    await AuditLog.create({
      action: 'OVERSTAY_ALERT_ACKNOWLEDGED',
      performedBy: { userId: req.user.userId, name: req.user.name, role: req.user.role },
      targetEntity: { entityType: 'OverstayAlert', entityId: alertId },
      details: { notes }
    });

    return res.status(200).json({
      success: true,
      message: 'Overstay alert acknowledged.',
      alert
    });
  } catch (error) {
    next(error);
  }
};

export const updateStudentAccountStatus = async (req, res, next) => {
  try {
    const { rollNumber } = req.params;
    const { status } = req.body;

    const studentProfile = await StudentProfile.findOne({ rollNumber: rollNumber.toUpperCase() });
    if (!studentProfile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const user = await User.findById(studentProfile.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    user.accountStatus = status;
    await user.save();

    await AuditLog.create({
      action: 'UPDATE_STUDENT_STATUS',
      performedBy: { userId: req.user.userId, name: req.user.name, role: req.user.role },
      targetEntity: { entityType: 'User', entityId: user.userId },
      details: { rollNumber, newStatus: status }
    });

    return res.status(200).json({
      success: true,
      message: `Student ${rollNumber} status updated to ${status}.`,
      user: {
        userId: user.userId,
        name: user.name,
        accountStatus: user.accountStatus
      }
    });
  } catch (error) {
    next(error);
  }
};
