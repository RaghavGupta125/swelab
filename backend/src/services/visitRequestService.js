import { VisitRequest } from '../models/VisitRequest.js';
import { StudentProfile } from '../models/StudentProfile.js';
import { User } from '../models/User.js';
import { VisitRecord } from '../models/VisitRecord.js';
import { REQUEST_STATUS, USER_STATUS, BUSINESS_RULES } from '../config/constants.js';
import {
  isWithinVisitingHours,
  isPastLateApprovalCutoff,
  isRequestExpiredByTimeout,
  getISTParts,
  parseISTDateTime,
  getNow
} from '../utils/timeUtils.js';
import { generateId, generateSecureToken } from '../utils/tokenUtils.js';
import { createQRPassForRequest } from './qrPassService.js';
import { createNotification } from './notificationService.js';

/**
 * Calculates current active checked-in visitors for a given student roll number (BR-001)
 */
export const getActiveVisitorCountForHost = async (hostStudentRollNumber) => {
  const activeRecords = await VisitRecord.find({
    hostStudentRollNumber: hostStudentRollNumber.toUpperCase(),
    exitTime: null
  });

  const totalActive = activeRecords.reduce((sum, rec) => sum + (rec.totalVisitorCount || 1), 0);
  return totalActive;
};

/**
 * Create or Pre-register a Visit Request
 */
export const createVisitRequest = async (requestData, initiatorRole = 'VISITOR', initiatorUser = null) => {
  const {
    visitorName,
    visitorPhone,
    identificationType,
    identificationNumber,
    hostStudentRollNumber,
    hostelId,
    roomNumber,
    purpose,
    visitDate,
    expectedEntryTimeStr,
    expectedExitTimeStr,
    accompanyingGuests = [],
    isDraft = false
  } = requestData;

  // Basic validation
  if (!hostStudentRollNumber) {
    const err = new Error('Host Student Roll Number is mandatory.');
    err.statusCode = 400;
    throw err;
  }

  // Verify host student profile exists (BR-012)
  const studentProfile = await StudentProfile.findOne({
    rollNumber: hostStudentRollNumber.toUpperCase()
  }).populate('userId');

  if (!studentProfile) {
    const err = new Error(`Host Student with Roll Number '${hostStudentRollNumber}' was not found in institutional records.`);
    err.statusCode = 404;
    throw err;
  }

  const hostUser = studentProfile.userId;

  // BR-002: Check host disciplinary suspension
  if (hostUser.accountStatus !== USER_STATUS.ACTIVE) {
    const err = new Error(`Host student is currently ${hostUser.accountStatus}. Cannot receive or create visit requests.`);
    err.statusCode = 403;
    throw err;
  }

  // BR-003: Self-Hosting Prohibition
  if (initiatorRole === 'STUDENT' && initiatorUser) {
    if (studentProfile.rollNumber === initiatorUser.rollNumber ||
        hostUser.email.toLowerCase() === initiatorUser.email.toLowerCase() ||
        hostUser.phoneNumber === visitorPhone) {
      const err = new Error('Self-hosting prohibition: A host student cannot create a visit request for themselves.');
      err.statusCode = 400;
      throw err;
    }
  }

  if (hostUser.phoneNumber === visitorPhone ||
      (identificationNumber && hostUser.userId === identificationNumber)) {
    const err = new Error('Self-hosting prohibition: Visitor identity details match host student.');
    err.statusCode = 400;
    throw err;
  }

  // BR-012: Student can only host within designated Hostel and Room
  const targetHostel = hostelId || studentProfile.hostelId;
  const targetRoom = roomNumber || studentProfile.roomNumber;

  if (targetHostel !== studentProfile.hostelId || targetRoom !== studentProfile.roomNumber) {
    const err = new Error(`Hostel Room Containment: Student ${studentProfile.rollNumber} is only authorized to host in ${studentProfile.hostelId}, Room ${studentProfile.roomNumber}.`);
    err.statusCode = 400;
    throw err;
  }

  // Validate Total Visitor Count quota (FR-011: up to 5)
  const guestCount = Array.isArray(accompanyingGuests) ? accompanyingGuests.length : 0;
  const totalVisitorCount = 1 + guestCount;

  if (totalVisitorCount > BUSINESS_RULES.REQUEST_MAX_VISITORS) {
    const err = new Error(`Exceeded maximum visitors allowed per request (${BUSINESS_RULES.REQUEST_MAX_VISITORS}). You requested ${totalVisitorCount}.`);
    err.statusCode = 400;
    throw err;
  }

  // Validate Time Window (FR-014, BR-004)
  if (!expectedEntryTimeStr || !expectedExitTimeStr || !visitDate) {
    const err = new Error('Visit date, expected entry time, and expected exit time are mandatory.');
    err.statusCode = 400;
    throw err;
  }

  if (!isWithinVisitingHours(expectedEntryTimeStr) || !isWithinVisitingHours(expectedExitTimeStr)) {
    const err = new Error(`Official visiting hours are strictly restricted between ${BUSINESS_RULES.VISITING_START_HOUR} and ${BUSINESS_RULES.VISITING_END_HOUR}.`);
    err.statusCode = 400;
    throw err;
  }

  const expectedEntryDate = parseISTDateTime(visitDate, expectedEntryTimeStr);
  const expectedExitDate = parseISTDateTime(visitDate, expectedExitTimeStr);

  if (expectedExitDate <= expectedEntryDate) {
    const err = new Error('Expected exit time must be after expected entry time.');
    err.statusCode = 400;
    throw err;
  }

  // BR-005: Same-day late approval cutoff check (18:40)
  const todayIST = getISTParts().dateStr;
  if (visitDate === todayIST && isPastLateApprovalCutoff()) {
    const err = new Error(`Cannot initiate or approve requests after ${BUSINESS_RULES.SAME_DAY_CUTOFF_HOUR} for same-day entry. Permitted hours end at ${BUSINESS_RULES.VISITING_END_HOUR}.`);
    err.statusCode = 400;
    throw err;
  }

  const requestId = generateId('VR');
  const accessToken = generateSecureToken('PASSKEY');

  const status = isDraft ? REQUEST_STATUS.DRAFT : REQUEST_STATUS.PENDING;

  const visitRequest = await VisitRequest.create({
    requestId,
    visitor: {
      fullName: visitorName,
      phoneNumber: visitorPhone,
      identificationType,
      identificationNumber
    },
    hostStudentRollNumber: studentProfile.rollNumber,
    hostStudentId: hostUser._id,
    hostelId: targetHostel,
    roomNumber: targetRoom,
    purpose: purpose || 'Personal Visit',
    visitDate,
    expectedEntryTime: expectedEntryDate,
    expectedExitTime: expectedExitDate,
    totalVisitorCount,
    accompanyingGuests,
    requestStatus: status,
    isPreRegistration: initiatorRole === 'STUDENT',
    accessToken
  });

  // If submitted as PENDING, alert the host student
  if (status === REQUEST_STATUS.PENDING) {
    await createNotification({
      recipientUserId: studentProfile.rollNumber,
      recipientRole: 'STUDENT',
      title: 'New Visitor Request Pending Approval',
      message: `Visitor ${visitorName} (${totalVisitorCount} person(s)) has requested entry to ${targetHostel} Room ${targetRoom} for ${purpose}. Requires approval within 20 minutes.`,
      type: 'REQUEST_CREATED',
      metadata: { requestId, visitorName, totalVisitorCount },
      email: hostUser.email
    });
  }

  return visitRequest;
};

/**
 * Host student approves a pending request (FR-022, UC-006)
 */
export const approveVisitRequest = async (requestId, studentUser) => {
  const request = await VisitRequest.findOne({ requestId });
  if (!request) {
    const err = new Error('Visit request not found.');
    err.statusCode = 404;
    throw err;
  }

  // Ownership verification
  if (studentUser.role === 'STUDENT') {
    const studentProfile = await StudentProfile.findOne({ userId: studentUser._id });
    if (!studentProfile || studentProfile.rollNumber !== request.hostStudentRollNumber) {
      const err = new Error('Unauthorized: You are not the designated host student for this request.');
      err.statusCode = 403;
      throw err;
    }

    // BR-002: Disciplinary check
    if (studentUser.accountStatus !== USER_STATUS.ACTIVE) {
      const err = new Error('Account disciplinary suspension: Blocked or inactive students cannot approve requests.');
      err.statusCode = 403;
      throw err;
    }
  }

  // State verification
  if (request.requestStatus !== REQUEST_STATUS.PENDING) {
    const err = new Error(`Cannot approve request in status '${request.requestStatus}'. Only PENDING requests can be approved.`);
    err.statusCode = 400;
    throw err;
  }

  // BR-006: 20-minute approval timeout check
  if (isRequestExpiredByTimeout(request.createdAt)) {
    request.requestStatus = REQUEST_STATUS.EXPIRED;
    request.expiredAt = getNow();
    await request.save();
    const err = new Error('Approval window expired: Requests must be approved within 20 minutes of submission.');
    err.statusCode = 400;
    throw err;
  }

  // BR-005: Same-day late cutoff check (18:40)
  const todayIST = getISTParts().dateStr;
  if (request.visitDate === todayIST && isPastLateApprovalCutoff()) {
    const err = new Error(`Cannot approve requests after ${BUSINESS_RULES.SAME_DAY_CUTOFF_HOUR} for same-day entry.`);
    err.statusCode = 400;
    throw err;
  }

  // Check if expectedEntryTime has already elapsed
  if (getNow().getTime() > new Date(request.expectedExitTime).getTime()) {
    request.requestStatus = REQUEST_STATUS.EXPIRED;
    request.expiredAt = getNow();
    await request.save();
    const err = new Error('Request has expired because scheduled visit time has completely passed.');
    err.statusCode = 400;
    throw err;
  }

  // BR-001: Check host concurrent quota (Max 5 active visitors simultaneously)
  const currentActiveVisitors = await getActiveVisitorCountForHost(request.hostStudentRollNumber);
  if (currentActiveVisitors + request.totalVisitorCount > BUSINESS_RULES.HOST_MAX_CONCURRENT_VISITORS) {
    const err = new Error(`Host quota exceeded: Student already has ${currentActiveVisitors} active visitor(s) inside hostel. Adding ${request.totalVisitorCount} would exceed maximum quota of ${BUSINESS_RULES.HOST_MAX_CONCURRENT_VISITORS}.`);
    err.statusCode = 400;
    throw err;
  }

  // Transition to APPROVED
  request.requestStatus = REQUEST_STATUS.APPROVED;
  request.approvedAt = getNow();
  await request.save();

  // FR-027: Generate dynamic QR Pass
  const qrPass = await createQRPassForRequest(request);

  // Notify visitor (simulated email or in-app)
  await createNotification({
    recipientUserId: request.visitor.phoneNumber,
    recipientRole: 'VISITOR',
    title: 'Visit Request Approved',
    message: `Your visit to ${request.hostelId} Room ${request.roomNumber} has been approved by ${request.hostStudentRollNumber}. Your QR pass is ready for gate entry.`,
    type: 'REQUEST_APPROVED',
    metadata: { requestId: request.requestId, passId: qrPass.passId, accessToken: request.accessToken }
  });

  return { request, qrPass };
};

/**
 * Host student rejects a pending request (FR-024, FR-025)
 */
export const rejectVisitRequest = async (requestId, studentUser, reason = '') => {
  const request = await VisitRequest.findOne({ requestId });
  if (!request) {
    const err = new Error('Visit request not found.');
    err.statusCode = 404;
    throw err;
  }

  if (studentUser.role === 'STUDENT') {
    const studentProfile = await StudentProfile.findOne({ userId: studentUser._id });
    if (!studentProfile || studentProfile.rollNumber !== request.hostStudentRollNumber) {
      const err = new Error('Unauthorized: You are not the designated host student.');
      err.statusCode = 403;
      throw err;
    }
  }

  if (request.requestStatus !== REQUEST_STATUS.PENDING) {
    const err = new Error(`Cannot reject request in status '${request.requestStatus}'.`);
    err.statusCode = 400;
    throw err;
  }

  request.requestStatus = REQUEST_STATUS.REJECTED;
  request.rejectedAt = getNow();
  request.rejectionReason = reason;
  await request.save();

  await createNotification({
    recipientUserId: request.visitor.phoneNumber,
    recipientRole: 'VISITOR',
    title: 'Visit Request Rejected',
    message: `Your visit request to ${request.hostelId} was declined by the host student. ${reason ? 'Reason: ' + reason : ''}`,
    type: 'REQUEST_REJECTED',
    metadata: { requestId: request.requestId, reason }
  });

  return request;
};

/**
 * Cancel a visit request before gate entry (FR-017)
 */
export const cancelVisitRequest = async (requestId, user) => {
  const request = await VisitRequest.findOne({ requestId });
  if (!request) {
    const err = new Error('Visit request not found.');
    err.statusCode = 404;
    throw err;
  }

  // Check if already checked in
  const existingVisit = await VisitRecord.findOne({ requestId });
  if (existingVisit) {
    const err = new Error('Cannot cancel a visit request that has already checked in at the gate.');
    err.statusCode = 400;
    throw err;
  }

  if (['REJECTED', 'EXPIRED', 'CANCELLED'].includes(request.requestStatus)) {
    const err = new Error(`Request is already ${request.requestStatus}.`);
    err.statusCode = 400;
    throw err;
  }

  request.requestStatus = REQUEST_STATUS.CANCELLED;
  request.cancelledAt = getNow();
  await request.save();

  return request;
};
