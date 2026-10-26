import {
  checkInGuardShift,
  checkOutGuardShift,
  getGuardTodayShift,
  hasActiveGuardShift
} from '../services/guardAttendanceService.js';
import { GuardAttendance } from '../models/GuardAttendance.js';
import { AuditLog } from '../models/AuditLog.js';

export const checkInShift = async (req, res, next) => {
  try {
    const guardId = req.guardProfile ? req.guardProfile.guardId : req.user.userId;
    const hostelId = req.guardProfile ? req.guardProfile.assignedHostelId : (req.body.hostelId || 'BH1');
    const guardName = req.user.name;

    const attendance = await checkInGuardShift(guardId, hostelId, guardName);

    await AuditLog.create({
      action: 'GUARD_SHIFT_CHECKIN',
      performedBy: { userId: req.user.userId, name: req.user.name, role: req.user.role },
      targetEntity: { entityType: 'GuardAttendance', entityId: attendance.attendanceId },
      details: { hostelId, shiftHours: attendance.shiftHours }
    });

    return res.status(200).json({
      success: true,
      message: 'Guard shift check-in recorded successfully. Gate duty active.',
      attendance
    });
  } catch (error) {
    next(error);
  }
};

export const checkOutShift = async (req, res, next) => {
  try {
    const guardId = req.guardProfile ? req.guardProfile.guardId : req.user.userId;
    const attendance = await checkOutGuardShift(guardId);

    await AuditLog.create({
      action: 'GUARD_SHIFT_CHECKOUT',
      performedBy: { userId: req.user.userId, name: req.user.name, role: req.user.role },
      targetEntity: { entityType: 'GuardAttendance', entityId: attendance.attendanceId },
      details: { guardId }
    });

    return res.status(200).json({
      success: true,
      message: 'Guard shift check-out recorded. Duty closed.',
      attendance
    });
  } catch (error) {
    next(error);
  }
};

export const getTodayShiftStatus = async (req, res, next) => {
  try {
    const guardId = req.guardProfile ? req.guardProfile.guardId : req.user.userId;
    const shift = await getGuardTodayShift(guardId);
    const isActive = await hasActiveGuardShift(guardId);

    return res.status(200).json({
      success: true,
      isActive,
      shift
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAttendance = async (req, res, next) => {
  try {
    const { hostelId, date } = req.query;
    const query = {};
    if (hostelId) query.hostelId = hostelId;
    if (date) query.date = date;

    const records = await GuardAttendance.find(query).sort({ createdAt: -1 }).limit(100);

    return res.status(200).json({
      success: true,
      count: records.length,
      records
    });
  } catch (error) {
    next(error);
  }
};
