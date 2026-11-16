import { GuardAttendance } from '../models/GuardAttendance.js';
import { GuardProfile } from '../models/GuardProfile.js';
import { GuardShift } from '../models/GuardShift.js';
import { getISTParts, getNow } from '../utils/timeUtils.js';
import { generateId } from '../utils/tokenUtils.js';

export const checkInGuardShift = async (guardId, hostelId, guardName) => {
  const { dateStr } = getISTParts();

  // Check if an active shift already exists today
  const existingActive = await GuardAttendance.findOne({
    guardId,
    date: dateStr,
    isActive: true
  });

  if (existingActive) {
    return existingActive;
  }

  const attendanceId = generateId('ATT');
  const assignedShift = await GuardShift.findOne({ guardId, date: dateStr, hostelId });
  const record = await GuardAttendance.create({
    attendanceId,
    guardId,
    guardName,
    hostelId,
    date: dateStr,
    checkInTime: getNow(),
    isActive: true,
    shiftHours: assignedShift
      ? `${assignedShift.label} (${assignedShift.startTime} - ${assignedShift.endTime})`
      : undefined
  });

  await GuardProfile.findOneAndUpdate({ guardId }, { isOnDuty: true });

  return record;
};

export const checkOutGuardShift = async (guardId) => {
  const { dateStr } = getISTParts();

  const activeShift = await GuardAttendance.findOne({
    guardId,
    date: dateStr,
    isActive: true
  });

  if (!activeShift) {
    const err = new Error('No active shift found for today to check out from.');
    err.statusCode = 400;
    throw err;
  }

  activeShift.checkOutTime = getNow();
  activeShift.isActive = false;
  await activeShift.save();

  await GuardProfile.findOneAndUpdate({ guardId }, { isOnDuty: false });

  return activeShift;
};

/**
 * Validates if guard currently has an active shift today (BR-011)
 */
export const hasActiveGuardShift = async (guardId) => {
  const { dateStr } = getISTParts();
  const activeShift = await GuardAttendance.findOne({
    guardId,
    date: dateStr,
    isActive: true
  });
  return !!activeShift;
};

export const getGuardTodayShift = async (guardId) => {
  const { dateStr } = getISTParts();
  return GuardAttendance.findOne({ guardId, date: dateStr }).sort({ createdAt: -1 });
};
