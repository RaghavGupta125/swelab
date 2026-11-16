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
import { generateSecureToken } from '../utils/tokenUtils.js';
import { createQRPassForRequest } from './qrPassService.js';
import { createNotification } from './notificationService.js';

// =============================================================================
// HELPER VALIDATORS (Simplified & Reusable for Viva Demonstration)
// =============================================================================

/**
 * Validates visit date & time window (BR-004: 06:00-19:00, BR-005: 18:40 cutoff)
 */
export const validateVisitTimes = (visitDate, entryTimeStr, exitTimeStr) => {
  if (!visitDate || !entryTimeStr || !exitTimeStr) {
    const err = new Error('Visit date, expected entry time, and expected exit time are mandatory.');
    err.statusCode = 400;
    throw err;
  }

  // BR-004: Official Visiting Window (06:00 to 19:00 IST)
  if (!isWithinVisitingHours(entryTimeStr) || !isWithinVisitingHours(exitTimeStr)) {
    const err = new Error(`Official visiting hours are strictly restricted between ${BUSINESS_RULES.VISITING_START_HOUR} and ${BUSINESS_RULES.VISITING_END_HOUR}.`);
    err.statusCode = 400;
    throw err;
  }

  const expectedEntryTime = parseISTDateTime(visitDate, entryTimeStr);
  const expectedExitTime = parseISTDateTime(visitDate, exitTimeStr);

  if (expectedExitTime <= expectedEntryTime) {
    const err = new Error('Expected exit time must be after expected entry time.');
    err.statusCode = 400;
    throw err;
  }

  // BR-005: Same-day late approval cutoff (no new same-day entries after 18:40)
  const todayIST = getISTParts().dateStr;
  if (visitDate === todayIST && isPastLateApprovalCutoff()) {
    const err = new Error(`Cannot initiate or approve requests after ${BUSINESS_RULES.SAME_DAY_CUTOFF_HOUR} for same-day entry. Permitted hours end at ${BUSINESS_RULES.VISITING_END_HOUR}.`);
    err.statusCode = 400;
    throw err;
  }

  return { expectedEntryTime, expectedExitTime };
};

/**
 * Validates host student status and prevents self-hosting (BR-002, BR-003, BR-012)
 */
export const validateHostEligibility = (studentProfile, visitorPhone, idNumber, targetHostel, targetRoom) => {
  const hostUser = studentProfile.userId;

  // BR-002: Disciplinary suspension check
  if (!hostUser || hostUser.accountStatus !== USER_STATUS.ACTIVE) {
    const err = new Error(`Host student is currently ${hostUser?.accountStatus || 'INACTIVE'}. Cannot receive or create visit requests.`);
    err.statusCode = 403;
    throw err;
  }

  // BR-003: Self-Hosting Prohibition (Visitor details match host student)
  if (hostUser.phoneNumber === visitorPhone || (idNumber && hostUser.userId === idNumber)) {
    const err = new Error('Self-hosting prohibition: Visitor identity details match host student.');
    err.statusCode = 400;
    throw err;
  }

  // BR-012: Hostel Room Containment (Must host in assigned hostel and room)
  if (targetHostel && targetHostel !== studentProfile.hostelId || targetRoom && targetRoom !== studentProfile.roomNumber) {
    const err = new Error(`Hostel Room Containment: Student ${studentProfile.rollNumber} is only authorized to host in ${studentProfile.hostelId}, Room ${studentProfile.roomNumber}.`);
    err.statusCode = 400;
    throw err;
  }
};

/**
 * Calculates current active checked-in visitors for a host student (BR-001)
 */
export const getActiveVisitorCountForHost = async (hostStudentRollNumber) => {
  const activeRecords = await VisitRecord.find({
    hostStudentRollNumber: hostStudentRollNumber.toUpperCase(),
    exitTime: null
  });
  return activeRecords.reduce((sum, rec) => sum + (rec.totalVisitorCount || 1), 0);
};

/**
 * Verifies caller has permission to view/modify request
 */
const assertRequestOwner = async (request, user, accessToken) => {
  if (user?.role === 'ADMIN') return;
  if (user?.role === 'STUDENT') {
    const profile = await StudentProfile.findOne({ userId: user._id });
    if (profile?.rollNumber === request.hostStudentRollNumber) return;
  }
  if (accessToken && request.accessToken && accessToken === request.accessToken) return;

  const err = new Error('You are not authorized to manage this visit request.');
  err.statusCode = 403;
  throw err;
};

// =============================================================================
// MAIN SERVICE FUNCTIONS
// =============================================================================

/**
 * 1. CREATE VISIT REQUEST (Visitor Kiosk or Student Pre-registration)
 */
export const createVisitRequest = async (requestData, initiatorRole = 'VISITOR', initiatorUser = null) => {
  const {
    visitorName,
    visitorPhone,
    identificationType,
    identificationNumber,
    vehicleNumber,
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

  const requestedHostRoll = hostStudentRollNumber || (initiatorRole === 'STUDENT' ? initiatorUser?.rollNumber : null);
  if (!requestedHostRoll) {
    const err = new Error('Host Student Roll Number is mandatory.');
    err.statusCode = 400;
    throw err;
  }

  const studentProfile = await StudentProfile.findOne({
    rollNumber: requestedHostRoll.toUpperCase()
  }).populate('userId');

  if (!studentProfile) {
    const err = new Error(`Host Student with Roll Number '${requestedHostRoll}' was not found in institutional records.`);
    err.statusCode = 404;
    throw err;
  }

  const targetHostel = hostelId || studentProfile.hostelId;
  const targetRoom = roomNumber || studentProfile.roomNumber;

  // Validate Host Eligibility (BR-002, BR-003, BR-012)
  validateHostEligibility(studentProfile, visitorPhone, identificationNumber, targetHostel, targetRoom);

  // Validate Visitor Count (FR-011: Max 5 visitors per request)
  const guestCount = Array.isArray(accompanyingGuests) ? accompanyingGuests.length : 0;
  const totalVisitorCount = 1 + guestCount;
  if (totalVisitorCount > BUSINESS_RULES.REQUEST_MAX_VISITORS) {
    const err = new Error(`Exceeded maximum visitors allowed per request (${BUSINESS_RULES.REQUEST_MAX_VISITORS}). You requested ${totalVisitorCount}.`);
    err.statusCode = 400;
    throw err;
  }

  const requestId = generateSecureToken('VR');
  const accessToken = generateSecureToken('PASSKEY');

  // Handle Draft Saves (if student or visitor is saving incomplete request)
  if (isDraft) {
    return VisitRequest.create({
      requestId,
      visitor: {
        fullName: visitorName || undefined,
        phoneNumber: visitorPhone || undefined,
        identificationType: identificationType || undefined,
        identificationNumber: identificationNumber || undefined,
        vehicleNumber: vehicleNumber || undefined
      },
      hostStudentRollNumber: studentProfile.rollNumber,
      hostStudentId: studentProfile.userId._id,
      hostelId: targetHostel,
      roomNumber: targetRoom,
      purpose: purpose || undefined,
      visitDate: visitDate || undefined,
      expectedEntryTime: visitDate && expectedEntryTimeStr ? parseISTDateTime(visitDate, expectedEntryTimeStr) : undefined,
      expectedExitTime: visitDate && expectedExitTimeStr ? parseISTDateTime(visitDate, expectedExitTimeStr) : undefined,
      totalVisitorCount,
      accompanyingGuests,
      requestStatus: REQUEST_STATUS.DRAFT,
      isPreRegistration: initiatorRole === 'STUDENT',
      accessToken
    });
  }

  // Validate Schedule Window (BR-004, BR-005)
  const { expectedEntryTime, expectedExitTime } = validateVisitTimes(visitDate, expectedEntryTimeStr, expectedExitTimeStr);

  const visitRequest = await VisitRequest.create({
    requestId,
    visitor: {
      fullName: visitorName,
      phoneNumber: visitorPhone,
      identificationType,
      identificationNumber,
      vehicleNumber: vehicleNumber || null
    },
    hostStudentRollNumber: studentProfile.rollNumber,
    hostStudentId: studentProfile.userId._id,
    hostelId: targetHostel,
    roomNumber: targetRoom,
    purpose: purpose || 'Personal Visit',
    visitDate,
    expectedEntryTime,
    expectedExitTime,
    totalVisitorCount,
    accompanyingGuests,
    requestStatus: REQUEST_STATUS.PENDING,
    isPreRegistration: initiatorRole === 'STUDENT',
    accessToken
  });

  // Notify Host Student of Pending Approval
  await createNotification({
    recipientUserId: studentProfile.rollNumber,
    recipientRole: 'STUDENT',
    title: 'New Visitor Request Pending Approval',
    message: `Visitor ${visitorName} (${totalVisitorCount} person(s)) has requested entry to ${targetHostel} Room ${targetRoom} for ${purpose}. Requires approval within 20 minutes.`,
    type: 'REQUEST_CREATED',
    metadata: { requestId, visitorName, totalVisitorCount },
    email: studentProfile.userId.email
  });

  return visitRequest;
};

/**
 * 2. UPDATE VISIT REQUEST
 */
export const updateVisitRequest = async (requestId, data, user, accessToken) => {
  const request = await VisitRequest.findOne({ requestId });
  if (!request) {
    const err = new Error('Visit request not found.');
    err.statusCode = 404;
    throw err;
  }

  await assertRequestOwner(request, user, accessToken);

  if (![REQUEST_STATUS.DRAFT, REQUEST_STATUS.PENDING].includes(request.requestStatus)) {
    const err = new Error('Only draft or pending requests can be edited.');
    err.statusCode = 400;
    throw err;
  }

  if (await VisitRecord.exists({ requestId })) {
    const err = new Error('A request cannot be edited after gate entry has been recorded.');
    err.statusCode = 400;
    throw err;
  }

  if (request.requestStatus === REQUEST_STATUS.DRAFT) {
    if (data.visitorName) request.visitor.fullName = data.visitorName;
    if (data.visitorPhone) request.visitor.phoneNumber = data.visitorPhone;
    if (data.identificationType) request.visitor.identificationType = data.identificationType;
    if (data.identificationNumber) request.visitor.identificationNumber = data.identificationNumber;
    if (data.purpose !== undefined) request.purpose = data.purpose;
    if (data.visitDate !== undefined) request.visitDate = data.visitDate;
    if (data.accompanyingGuests) {
      request.accompanyingGuests = data.accompanyingGuests;
      request.totalVisitorCount = data.accompanyingGuests.length + 1;
    }
    await request.save();
    return request;
  }

  // If already PENDING, re-validate timing and host eligibility
  const studentProfile = await StudentProfile.findOne({ rollNumber: request.hostStudentRollNumber }).populate('userId');
  validateHostEligibility(studentProfile, data.visitorPhone || request.visitor?.phoneNumber, data.identificationNumber || request.visitor?.identificationNumber, request.hostelId, request.roomNumber);

  const visitDate = data.visitDate || request.visitDate;
  const entryStr = data.expectedEntryTimeStr || (request.expectedEntryTime ? getISTParts(request.expectedEntryTime).timeStr : '');
  const exitStr = data.expectedExitTimeStr || (request.expectedExitTime ? getISTParts(request.expectedExitTime).timeStr : '');

  const { expectedEntryTime, expectedExitTime } = validateVisitTimes(visitDate, entryStr, exitStr);

  if (data.visitorName) request.visitor.fullName = data.visitorName;
  if (data.visitorPhone) request.visitor.phoneNumber = data.visitorPhone;
  if (data.purpose) request.purpose = data.purpose;
  request.visitDate = visitDate;
  request.expectedEntryTime = expectedEntryTime;
  request.expectedExitTime = expectedExitTime;

  await request.save();
  return request;
};

/**
 * 3. SUBMIT DRAFT REQUEST
 */
export const submitVisitDraft = async (requestId, user, accessToken = null) => {
  const request = await VisitRequest.findOne({ requestId });
  if (!request) {
    const err = new Error('Draft not found.');
    err.statusCode = 404;
    throw err;
  }

  await assertRequestOwner(request, user, accessToken);

  if (request.requestStatus !== REQUEST_STATUS.DRAFT) {
    const err = new Error('Only a draft can be submitted.');
    err.statusCode = 400;
    throw err;
  }

  const studentProfile = await StudentProfile.findOne({ rollNumber: request.hostStudentRollNumber }).populate('userId');
  validateHostEligibility(studentProfile, request.visitor?.phoneNumber, request.visitor?.identificationNumber, request.hostelId, request.roomNumber);

  const entryStr = request.expectedEntryTime ? getISTParts(request.expectedEntryTime).timeStr : '';
  const exitStr = request.expectedExitTime ? getISTParts(request.expectedExitTime).timeStr : '';
  const { expectedEntryTime, expectedExitTime } = validateVisitTimes(request.visitDate, entryStr, exitStr);

  request.expectedEntryTime = expectedEntryTime;
  request.expectedExitTime = expectedExitTime;
  request.requestStatus = REQUEST_STATUS.PENDING;
  await request.save();

  await createNotification({
    recipientUserId: request.hostStudentRollNumber,
    recipientRole: 'STUDENT',
    title: 'New Visitor Request Pending Approval',
    message: `Visitor ${request.visitor.fullName} (${request.totalVisitorCount} person(s)) has requested entry to ${request.hostelId} Room ${request.roomNumber}.`,
    type: 'REQUEST_CREATED',
    metadata: { requestId: request.requestId, visitorName: request.visitor.fullName },
    email: studentProfile?.userId?.email
  });

  return request;
};

/**
 * 4. APPROVE VISIT REQUEST (Host student issues dynamic QR pass)
 */
export const approveVisitRequest = async (requestId, studentUser) => {
  const request = await VisitRequest.findOne({ requestId });
  if (!request) {
    const err = new Error('Visit request not found.');
    err.statusCode = 404;
    throw err;
  }

  // Verify host ownership (only assigned student can approve)
  if (studentUser.role === 'STUDENT') {
    const studentProfile = await StudentProfile.findOne({ userId: studentUser._id });
    if (!studentProfile || studentProfile.rollNumber !== request.hostStudentRollNumber) {
      const err = new Error('Unauthorized: You are not the designated host student for this request.');
      err.statusCode = 403;
      throw err;
    }

    // BR-002: Disciplinary suspension check
    if (studentUser.accountStatus !== USER_STATUS.ACTIVE) {
      const err = new Error('Account disciplinary suspension: Blocked or inactive students cannot approve requests.');
      err.statusCode = 403;
      throw err;
    }
  }

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

  // Check if scheduled visit time has completely passed
  if (getNow().getTime() > new Date(request.expectedExitTime).getTime()) {
    request.requestStatus = REQUEST_STATUS.EXPIRED;
    request.expiredAt = getNow();
    await request.save();
    const err = new Error('Request has expired because scheduled visit time has completely passed.');
    err.statusCode = 400;
    throw err;
  }

  // BR-001: Host concurrent visitor quota (Max 5 active visitors simultaneously)
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

  // FR-027: Generate cryptographic single-use QR Pass
  const qrPass = await createQRPassForRequest(request);

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
 * 5. REJECT VISIT REQUEST (Host student declines request)
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
 * 6. CANCEL VISIT REQUEST (Before Gate Entry)
 */
export const cancelVisitRequest = async (requestId, user, accessToken = null) => {
  const request = await VisitRequest.findOne({ requestId });
  if (!request) {
    const err = new Error('Visit request not found.');
    err.statusCode = 404;
    throw err;
  }

  await assertRequestOwner(request, user, accessToken);

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

  await createNotification({
    recipientUserId: request.hostStudentRollNumber,
    recipientRole: 'STUDENT',
    title: 'Visit Request Cancelled',
    message: `Visit request ${request.requestId} for ${request.visitor?.fullName || 'a visitor'} was cancelled.`,
    type: 'REQUEST_CANCELLED',
    metadata: { requestId: request.requestId }
  });

  return request;
};
