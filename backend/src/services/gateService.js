import { VisitRequest } from '../models/VisitRequest.js';
import { QRPass } from '../models/QRPass.js';
import { VisitRecord } from '../models/VisitRecord.js';
import { Hostel } from '../models/Hostel.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { REQUEST_STATUS, PASS_STATUS } from '../config/constants.js';
import { isWithinVisitingHours, computeOverstay, getISTParts, getNow } from '../utils/timeUtils.js';
import { generateId } from '../utils/tokenUtils.js';
import { hasActiveGuardShift } from './guardAttendanceService.js';
import { createNotification } from './notificationService.js';
import { recordOverstayIncident } from './overstayService.js';

/**
 * Verify visitor pass or credentials at gate (FR-029, FR-031)
 */
export const verifyGatePass = async ({ token, passId, requestId, phone, rollNumber }) => {
  let qrPass = null;
  let visitRequest = null;

  if (token) {
    qrPass = await QRPass.findOne({ token });
  } else if (passId) {
    qrPass = await QRPass.findOne({ passId });
  }

  if (qrPass) {
    visitRequest = await VisitRequest.findOne({ requestId: qrPass.requestId });
  } else if (requestId) {
    visitRequest = await VisitRequest.findOne({ requestId });
    if (visitRequest) {
      qrPass = await QRPass.findOne({ requestId });
    }
  } else if (phone || rollNumber) {
    const query = {};
    if (phone) query['visitor.phoneNumber'] = phone.trim();
    if (rollNumber) query.hostStudentRollNumber = rollNumber.trim().toUpperCase();
    query.requestStatus = REQUEST_STATUS.APPROVED;

    // Pick latest approved request
    visitRequest = await VisitRequest.findOne(query).sort({ createdAt: -1 });
    if (visitRequest) {
      qrPass = await QRPass.findOne({ requestId: visitRequest.requestId });
    }
  }

  if (!visitRequest) {
    return {
      isValid: false,
      reason: 'No matching approved visit request found for provided credentials.'
    };
  }

  // Check request status (BR-007)
  if (visitRequest.requestStatus !== REQUEST_STATUS.APPROVED) {
    return {
      isValid: false,
      reason: `Pass rejected: Request is in '${visitRequest.requestStatus}' status, not APPROVED.`,
      visitRequest
    };
  }

  // Check if current time is within official visiting hours (BR-004)
  const currentIST = getISTParts();
  if (!isWithinVisitingHours(currentIST.timeStr)) {
    return {
      isValid: false,
      reason: `Gate access denied: Current time (${currentIST.timeStr}) is outside official visiting hours (06:00 to 19:00).`,
      visitRequest
    };
  }

  // Check if visit record already exists
  const existingVisit = await VisitRecord.findOne({ requestId: visitRequest.requestId });

  return {
    isValid: true,
    visitRequest,
    qrPass,
    existingVisit,
    isCurrentlyInside: existingVisit && existingVisit.exitTime === null,
    hasAlreadyCompleted: existingVisit && existingVisit.exitTime !== null
  };
};

/**
 * Gate Check-In (FR-032, UC-011)
 */
export const recordGateEntry = async ({
  passToken,
  passId,
  requestId,
  guardId,
  hostelId,
  manualIdNumberVerified = null,
  notes = ''
}) => {
  // BR-011: Active guard shift requirement
  const isShiftActive = await hasActiveGuardShift(guardId);
  if (!isShiftActive) {
    const err = new Error('Active shift requirement: Security Guard must check in for duty shift before recording gate entries.');
    err.statusCode = 403;
    throw err;
  }

  const verification = await verifyGatePass({ token: passToken, passId, requestId });
  if (!verification.isValid) {
    const err = new Error(verification.reason);
    err.statusCode = 400;
    throw err;
  }

  const { visitRequest, qrPass, existingVisit, isCurrentlyInside, hasAlreadyCompleted } = verification;

  // BR-034: Duplicate entry prevention
  if (isCurrentlyInside) {
    const err = new Error('Duplicate Check-In: Visitor is already checked in and marked inside the hostel.');
    err.statusCode = 409;
    throw err;
  }

  // BR-008: Single pass execution
  if (hasAlreadyCompleted) {
    const err = new Error('Pass already consumed: This pass was already used and checked out. Single pass permits exactly one entry.');
    err.statusCode = 400;
    throw err;
  }

  const visitId = generateId('VREC');
  const entryTime = getNow();

  const visitRecord = await VisitRecord.create({
    visitId,
    requestId: visitRequest.requestId,
    passId: qrPass ? qrPass.passId : 'MANUAL',
    hostStudentRollNumber: visitRequest.hostStudentRollNumber,
    hostelId: hostelId || visitRequest.hostelId,
    visitorName: visitRequest.visitor.fullName,
    visitorPhone: visitRequest.visitor.phoneNumber,
    totalVisitorCount: visitRequest.totalVisitorCount,
    entryTime,
    expectedExitTime: visitRequest.expectedExitTime,
    guardId,
    notes: notes || (manualIdNumberVerified ? `Verified Govt ID: ${manualIdNumberVerified}` : '')
  });

  // Update pass state
  if (qrPass) {
    qrPass.status = PASS_STATUS.IN_USE;
    await qrPass.save();
  }

  // Update counts
  await Hostel.findOneAndUpdate(
    { hostelId: visitRequest.hostelId },
    { $inc: { activeVisitorsCount: visitRequest.totalVisitorCount } }
  );

  await StudentProfile.findOneAndUpdate(
    { rollNumber: visitRequest.hostStudentRollNumber },
    { $inc: { activeVisitorsCount: visitRequest.totalVisitorCount } }
  );

  // Notify student and warden
  await createNotification({
    recipientUserId: visitRequest.hostStudentRollNumber,
    recipientRole: 'STUDENT',
    title: 'Visitor Arrived & Entered Hostel',
    message: `${visitRequest.visitor.fullName} (${visitRequest.totalVisitorCount} guest(s)) checked in through ${visitRequest.hostelId} gate at ${getISTParts(entryTime).timeStr}.`,
    type: 'GATE_ENTRY',
    metadata: { visitId, requestId: visitRequest.requestId }
  });

  return visitRecord;
};

/**
 * Gate Check-Out (FR-035, UC-012)
 */
export const recordGateExit = async ({
  visitId,
  requestId,
  token,
  guardId,
  notes = ''
}) => {
  // BR-011: Active guard shift requirement
  const isShiftActive = await hasActiveGuardShift(guardId);
  if (!isShiftActive) {
    const err = new Error('Active shift requirement: Security Guard must check in for duty shift before recording gate exits.');
    err.statusCode = 403;
    throw err;
  }

  let visitRecord = null;
  if (visitId) {
    visitRecord = await VisitRecord.findOne({ visitId });
  } else if (requestId) {
    visitRecord = await VisitRecord.findOne({ requestId });
  } else if (token) {
    const pass = await QRPass.findOne({ token });
    if (pass) {
      visitRecord = await VisitRecord.findOne({ requestId: pass.requestId });
    }
  }

  if (!visitRecord) {
    const err = new Error('No active visit record found. Cannot check out an unrecorded entry.');
    err.statusCode = 404;
    throw err;
  }

  // BR-009: Sequential Gate State
  if (!visitRecord.entryTime) {
    const err = new Error('Sequential gate state violation: Visitor cannot have an exit recorded without entry timestamp.');
    err.statusCode = 400;
    throw err;
  }

  if (visitRecord.exitTime !== null) {
    const err = new Error('Visitor has already been checked out.');
    err.statusCode = 400;
    throw err;
  }

  const exitTime = getNow();
  visitRecord.exitTime = exitTime;
  visitRecord.exitGuardId = guardId;

  const durationMs = exitTime.getTime() - new Date(visitRecord.entryTime).getTime();
  visitRecord.stayDurationMinutes = Math.max(1, Math.round(durationMs / 60000));

  // BR-010: Overstay Calculation Threshold
  const isOverstay = computeOverstay(visitRecord.expectedExitTime, exitTime);
  visitRecord.overstayStatus = isOverstay;

  if (notes) {
    visitRecord.notes = (visitRecord.notes ? visitRecord.notes + ' | ' : '') + notes;
  }

  await visitRecord.save();

  // BR-008: Pass permanently invalidated against re-entry
  await QRPass.findOneAndUpdate(
    { requestId: visitRecord.requestId },
    {
      status: PASS_STATUS.CONSUMED,
      invalidatedAt: exitTime,
      invalidationReason: 'Visitor checked out of hostel.'
    }
  );

  // Decrement occupancy and student active visitors
  await Hostel.findOneAndUpdate(
    { hostelId: visitRecord.hostelId },
    { $inc: { activeVisitorsCount: -visitRecord.totalVisitorCount } }
  );

  await StudentProfile.findOneAndUpdate(
    { rollNumber: visitRecord.hostStudentRollNumber },
    { $inc: { activeVisitorsCount: -visitRecord.totalVisitorCount } }
  );

  // If overstay detected, log incident and alert warden
  if (isOverstay) {
    await recordOverstayIncident({
      visitId: visitRecord.visitId,
      requestId: visitRecord.requestId,
      hostelId: visitRecord.hostelId,
      studentRollNumber: visitRecord.hostStudentRollNumber,
      visitorName: visitRecord.visitorName,
      expectedExitTime: visitRecord.expectedExitTime,
      detectedAt: exitTime
    });
  }

  // Notify student
  await createNotification({
    recipientUserId: visitRecord.hostStudentRollNumber,
    recipientRole: 'STUDENT',
    title: 'Visitor Checked Out',
    message: `${visitRecord.visitorName} checked out of ${visitRecord.hostelId} at ${getISTParts(exitTime).timeStr}.${isOverstay ? ' (Note: Visitor exceeded scheduled departure time)' : ''}`,
    type: 'GATE_EXIT',
    metadata: { visitId: visitRecord.visitId, isOverstay }
  });

  return visitRecord;
};

/**
 * Fetch all currently checked-in visitors for a hostel or all hostels
 */
export const getActiveInsideVisitors = async (hostelId = null) => {
  const query = { exitTime: null };
  if (hostelId) {
    query.hostelId = hostelId;
  }
  return VisitRecord.find(query).sort({ entryTime: -1 });
};
