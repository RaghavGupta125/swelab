import {
  checkInGuardShift,
  checkOutGuardShift,
  getGuardTodayShift,
  hasActiveGuardShift
} from '../services/guardAttendanceService.js';
import { GuardAttendance } from '../models/GuardAttendance.js';
import { GuardShift } from '../models/GuardShift.js';
import { GuardProfile } from '../models/GuardProfile.js';
import { AuditLog } from '../models/AuditLog.js';
import { generateId } from '../utils/tokenUtils.js';
import { getISTParts } from '../utils/timeUtils.js';

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

const wardenHostel = (req, requestedHostel) => req.wardenProfile?.assignedHostelId || requestedHostel;

export const getAssignableGuards = async (req, res, next) => {
  try {
    const hostelId = wardenHostel(req, req.query.hostelId);
    const profiles = await GuardProfile.find(hostelId ? { assignedHostelId: hostelId } : {})
      .populate('userId', 'name email accountStatus')
      .sort({ guardId: 1 });
    return res.status(200).json({
      success: true,
      guards: profiles.filter((profile) => profile.userId?.accountStatus === 'ACTIVE').map((profile) => ({
        guardId: profile.guardId,
        name: profile.userId.name,
        assignedHostelId: profile.assignedHostelId
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const getShiftAssignments = async (req, res, next) => {
  try {
    const date = req.query.date || getISTParts().dateStr;
    const hostelId = wardenHostel(req, req.query.hostelId);
    const query = { date };
    if (hostelId) query.hostelId = hostelId;
    const shifts = await GuardShift.find(query).sort({ startTime: 1, guardName: 1 });
    return res.status(200).json({ success: true, shifts });
  } catch (error) {
    next(error);
  }
};

export const assignGuardShift = async (req, res, next) => {
  try {
    const { guardId, date, label, startTime, endTime, hostelId: requestedHostel } = req.body;
    const hostelId = wardenHostel(req, requestedHostel);
    if (!guardId || !date || !label?.trim() || !startTime || !endTime || !hostelId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) || startTime === endTime) {
      return res.status(400).json({ success: false, message: 'Provide a guard, hostel, date, shift name, and valid distinct start/end times.' });
    }
    const profile = await GuardProfile.findOne({ guardId }).populate('userId', 'name accountStatus');
    if (!profile || !profile.userId || profile.userId.accountStatus !== 'ACTIVE') {
      return res.status(404).json({ success: false, message: 'Active guard not found.' });
    }
    if (profile.assignedHostelId !== hostelId) {
      return res.status(403).json({ success: false, message: 'Guard is assigned to a different hostel.' });
    }
    if (await GuardAttendance.exists({ guardId, date, isActive: true })) {
      return res.status(409).json({ success: false, message: 'This guard is already clocked in; the shift assignment cannot be changed.' });
    }
    const shift = await GuardShift.findOneAndUpdate(
      { guardId, date },
      {
        $set: { guardName: profile.userId.name, hostelId, date, label: label.trim(), startTime, endTime, assignedBy: req.user.userId },
        $setOnInsert: { shiftId: generateId('SHIFT') }
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    await AuditLog.create({
      action: 'GUARD_SHIFT_ASSIGNED',
      performedBy: { userId: req.user.userId, name: req.user.name, role: req.user.role },
      targetEntity: { entityType: 'GuardShift', entityId: shift.shiftId },
      details: { guardId, hostelId, date, label, startTime, endTime }
    });
    return res.status(200).json({ success: true, message: 'Guard shift assigned.', shift });
  } catch (error) {
    next(error);
  }
};

export const removeGuardShiftAssignment = async (req, res, next) => {
  try {
    const shift = await GuardShift.findOne({ shiftId: req.params.shiftId });
    if (!shift) return res.status(404).json({ success: false, message: 'Shift assignment not found.' });
    if (req.wardenProfile && req.wardenProfile.assignedHostelId !== shift.hostelId) {
      return res.status(403).json({ success: false, message: 'This shift belongs to another hostel.' });
    }
    if (await GuardAttendance.exists({ guardId: shift.guardId, date: shift.date })) {
      return res.status(409).json({ success: false, message: 'A shift with attendance history cannot be removed.' });
    }
    await shift.deleteOne();
    await AuditLog.create({
      action: 'GUARD_SHIFT_ASSIGNMENT_REMOVED',
      performedBy: { userId: req.user.userId, name: req.user.name, role: req.user.role },
      targetEntity: { entityType: 'GuardShift', entityId: shift.shiftId },
      details: { guardId: shift.guardId, date: shift.date }
    });
    return res.status(200).json({ success: true, message: 'Shift assignment removed.' });
  } catch (error) {
    next(error);
  }
};
