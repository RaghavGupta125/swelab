import { BUSINESS_RULES } from '../config/constants.js';

/**
 * Returns current Date object. Can be overridden for testing.
 */
let mockedNow = null;

export const setMockTime = (timeStringOrDate) => {
  mockedNow = timeStringOrDate ? new Date(timeStringOrDate) : null;
};

export const getNow = () => {
  return mockedNow ? new Date(mockedNow) : new Date();
};

/**
 * Converts a Date to an IST (Asia/Kolkata) time parts: { hours, minutes, dateStr, timeStr }
 */
export const getISTParts = (dateInput = null) => {
  const d = dateInput ? new Date(dateInput) : getNow();
  
  // Format into Asia/Kolkata parts
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: BUSINESS_RULES.TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(d);
  const partMap = {};
  parts.forEach(p => { partMap[p.type] = p.value; });
  
  const hours = parseInt(partMap.hour, 10);
  const minutes = parseInt(partMap.minute, 10);
  const seconds = parseInt(partMap.second, 10);
  const year = partMap.year;
  const month = partMap.month;
  const day = partMap.day;
  
  return {
    year,
    month,
    day,
    hours,
    minutes,
    seconds,
    dateStr: `${year}-${month}-${day}`, // YYYY-MM-DD
    timeStr: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}` // HH:MM
  };
};

/**
 * Checks if a given time string (HH:MM) is strictly within official visiting window (06:00 to 19:00) (BR-004)
 */
export const isWithinVisitingHours = (timeStr) => {
  if (!timeStr) return false;
  const [h, m] = timeStr.split(':').map(Number);
  const minutesFromMidnight = h * 60 + m;
  
  const startMinutes = 6 * 60;   // 06:00 = 360
  const endMinutes = 19 * 60;   // 19:00 = 1140
  
  return minutesFromMidnight >= startMinutes && minutesFromMidnight <= endMinutes;
};

/**
 * Checks if current time is past same-day cutoff 18:40 IST (BR-005)
 */
export const isPastLateApprovalCutoff = (dateInput = null) => {
  const { hours, minutes } = getISTParts(dateInput);
  const currentTotalMinutes = hours * 60 + minutes;
  const cutoffMinutes = 18 * 60 + 40; // 18:40 = 1120
  return currentTotalMinutes > cutoffMinutes;
};

/**
 * Checks if a pending request has exceeded the 20-minute approval window (BR-006)
 */
export const isRequestExpiredByTimeout = (createdAt, timeoutMinutes = BUSINESS_RULES.APPROVAL_TIMEOUT_MINUTES) => {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  const now = getNow().getTime();
  const elapsedMinutes = (now - created) / (1000 * 60);
  return elapsedMinutes > timeoutMinutes;
};

/**
 * Dynamically computes whether an active visit is in overstay status (BR-010)
 * Overstay occurs if current time > expectedExitTime OR current time > 19:00
 */
export const computeOverstay = (expectedExitTime, actualExitTime = null) => {
  const now = getNow();
  const exitCheck = actualExitTime ? new Date(actualExitTime) : now;
  
  const expectedDate = new Date(expectedExitTime);
  
  // Rule 1: Exceeded expected exit time
  if (exitCheck.getTime() > expectedDate.getTime()) {
    return true;
  }
  
  // Rule 2: Exceeded 19:00 boundary for the day
  const { hours, minutes } = getISTParts(exitCheck);
  const totalMinutes = hours * 60 + minutes;
  if (totalMinutes > 19 * 60) {
    return true;
  }
  
  return false;
};

/**
 * Combines a date string 'YYYY-MM-DD' and time string 'HH:MM' into a Date object in IST
 */
export const parseISTDateTime = (dateStr, timeStr) => {
  // Using explicit ISO format with +05:30 offset
  const isoStr = `${dateStr}T${timeStr}:00+05:30`;
  return new Date(isoStr);
};
