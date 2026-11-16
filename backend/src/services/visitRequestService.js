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

  // Basic validation
  const requestedHostRoll = hostStudentRollNumber || (initiatorRole === 'STUDENT' ? initiatorUser?.rollNumber : null);
  if (!requestedHostRoll) {
    const err = new Error('Host Student Roll Number is mandatory.');
    err.statusCode = 400;
    throw err;
  }

  // Verify host student profile exists (BR-012)
  const studentProfile = await StudentProfile.findOne({
    rollNumber: requestedHostRoll.toUpperCase()
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
    if (hostUser.phoneNumber === visitorPhone) {
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

  if (isDraft) {
    return VisitRequest.create({
      requestId: generateSecureToken('VR'),
      visitor: {
        fullName: visitorName || undefined,
        phoneNumber: visitorPhone || undefined,
        identificationType: identificationType || undefined,
        identificationNumber: identificationNumber || undefined,
        vehicleNumber: vehicleNumber || undefined
      },
      hostStudentRollNumber: studentProfile.rollNumber,
      hostStudentId: hostUser._id,
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
      accessToken: generateSecureToken('PASSKEY')
    });
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

  const requestId = generateSecureToken('VR');
  const accessToken = generateSecureToken('PASSKEY');

  const status = isDraft ? REQUEST_STATUS.DRAFT : REQUEST_STATUS.PENDING;

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

const validateRequestUpdate = async (data, request) => {
  const required = ['visitorName', 'visitorPhone', 'identificationType', 'identificationNumber', 'purpose', 'visitDate', 'expectedEntryTimeStr', 'expectedExitTimeStr'];
  const missing = required.filter((key) => !String(data[key] ?? '').trim());
  if (missing.length) {
    const err = new Error(`Complete all required visit details before submitting: ${missing.join(', ')}.`);
    err.statusCode = 400;
    throw err;
  }
  const studentProfile = await StudentProfile.findOne({ rollNumber: request.hostStudentRollNumber }).populate('userId');
  if (!studentProfile || !studentProfile.userId || studentProfile.userId.accountStatus !== USER_STATUS.ACTIVE) {
    const err = new Error('The host student is not active and cannot receive a visit request.');
    err.statusCode = 403;
    throw err;
  }
  if ((data.hostelId && data.hostelId !== studentProfile.hostelId) || (data.roomNumber && data.roomNumber !== studentProfile.roomNumber)) {
    const err = new Error('Hostel and room must match the host student’s assigned residence.');
    err.statusCode = 400;
    throw err;
  }
  if (studentProfile.userId.phoneNumber === data.visitorPhone || studentProfile.userId.userId === data.identificationNumber) {
    const err = new Error('Self-hosting prohibition: visitor identity details match the host student.');
    err.statusCode = 400;
    throw err;
  }
  const guests = Array.isArray(data.accompanyingGuests) ? data.accompanyingGuests : [];
  if (guests.length > 4 || 1 + guests.length > BUSINESS_RULES.REQUEST_MAX_VISITORS) {
    const err = new Error(`A request may include at most ${BUSINESS_RULES.REQUEST_MAX_VISITORS - 1} accompanying guests.`);
    err.statusCode = 400;
    throw err;
  }
  if (!isWithinVisitingHours(data.expectedEntryTimeStr) || !isWithinVisitingHours(data.expectedExitTimeStr)) {
    const err = new Error(`Official visiting hours are strictly restricted between ${BUSINESS_RULES.VISITING_START_HOUR} and ${BUSINESS_RULES.VISITING_END_HOUR}.`);
    err.statusCode = 400;
    throw err;
  }
  const expectedEntryTime = parseISTDateTime(data.visitDate, data.expectedEntryTimeStr);
  const expectedExitTime = parseISTDateTime(data.visitDate, data.expectedExitTimeStr);
  if (expectedExitTime <= expectedEntryTime) {
    const err = new Error('Expected exit time must be after expected entry time.');
    err.statusCode = 400;
    throw err;
  }
  if (data.visitDate === getISTParts().dateStr && isPastLateApprovalCutoff()) {
    const err = new Error(`Cannot submit same-day requests after ${BUSINESS_RULES.SAME_DAY_CUTOFF_HOUR}.`);
    err.statusCode = 400;
    throw err;
  }
  return { studentProfile, guests, expectedEntryTime, expectedExitTime };
};

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
    const next = data;
    request.visitor = {
      fullName: next.visitorName ?? request.visitor?.fullName,
      phoneNumber: next.visitorPhone ?? request.visitor?.phoneNumber,
      identificationType: next.identificationType ?? request.visitor?.identificationType,
      identificationNumber: next.identificationNumber ?? request.visitor?.identificationNumber
    };
    if (next.purpose !== undefined) request.purpose = next.purpose || undefined;
    if (next.visitDate !== undefined) request.visitDate = next.visitDate || undefined;
    if (next.visitDate && next.expectedEntryTimeStr) request.expectedEntryTime = parseISTDateTime(next.visitDate, next.expectedEntryTimeStr);
    else if (next.expectedEntryTimeStr === '') request.expectedEntryTime = undefined;
    if (next.visitDate && next.expectedExitTimeStr) request.expectedExitTime = parseISTDateTime(next.visitDate, next.expectedExitTimeStr);
    else if (next.expectedExitTimeStr === '') request.expectedExitTime = undefined;
    if (Array.isArray(next.accompanyingGuests)) {
      request.accompanyingGuests = next.accompanyingGuests;
      request.totalVisitorCount = next.accompanyingGuests.length + 1;
    }
    await request.save();
    return request;
  }
  const merged = {
    visitorName: data.visitorName ?? request.visitor?.fullName,
    visitorPhone: data.visitorPhone ?? request.visitor?.phoneNumber,
    identificationType: data.identificationType ?? request.visitor?.identificationType,
    identificationNumber: data.identificationNumber ?? request.visitor?.identificationNumber,
    purpose: data.purpose ?? request.purpose,
    visitDate: data.visitDate ?? request.visitDate,
    expectedEntryTimeStr: data.expectedEntryTimeStr ?? (request.expectedEntryTime ? getISTParts(request.expectedEntryTime).timeStr : ''),
    expectedExitTimeStr: data.expectedExitTimeStr ?? (request.expectedExitTime ? getISTParts(request.expectedExitTime).timeStr : ''),
    hostelId: data.hostelId ?? request.hostelId,
    roomNumber: data.roomNumber ?? request.roomNumber,
    accompanyingGuests: data.accompanyingGuests ?? request.accompanyingGuests
  };
  const { guests, expectedEntryTime, expectedExitTime } = await validateRequestUpdate(merged, request);
  Object.assign(request, {
    visitor: {
      fullName: merged.visitorName,
      phoneNumber: merged.visitorPhone,
      identificationType: merged.identificationType,
      identificationNumber: merged.identificationNumber
    },
    purpose: merged.purpose,
    visitDate: merged.visitDate,
    expectedEntryTime,
    expectedExitTime,
    totalVisitorCount: guests.length + 1,
    accompanyingGuests: guests
  });
  await request.save();
  if (request.requestStatus === REQUEST_STATUS.PENDING) {
    await createNotification({
      recipientUserId: request.hostStudentRollNumber,
      recipientRole: 'STUDENT',
      title: 'Pending Visitor Request Updated',
      message: `The details for request ${request.requestId} were updated. Review the latest visitor and visit information.`,
      type: 'REQUEST_UPDATED',
      metadata: { requestId: request.requestId }
    });
  }
  return request;
};

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
  const data = {
    visitorName: request.visitor?.fullName,
    visitorPhone: request.visitor?.phoneNumber,
    identificationType: request.visitor?.identificationType,
    identificationNumber: request.visitor?.identificationNumber,
    purpose: request.purpose,
    visitDate: request.visitDate,
    expectedEntryTimeStr: request.expectedEntryTime ? getISTParts(request.expectedEntryTime).timeStr : '',
    expectedExitTimeStr: request.expectedExitTime ? getISTParts(request.expectedExitTime).timeStr : '',
    hostelId: request.hostelId,
    roomNumber: request.roomNumber,
    accompanyingGuests: request.accompanyingGuests
  };
  await validateRequestUpdate(data, request);
  request.requestStatus = REQUEST_STATUS.PENDING;
  await request.save();
  const host = await StudentProfile.findOne({ rollNumber: request.hostStudentRollNumber }).populate('userId');
  await createNotification({
    recipientUserId: request.hostStudentRollNumber,
    recipientRole: 'STUDENT',
    title: 'New Visitor Request Pending Approval',
    message: `Visitor ${request.visitor.fullName} (${request.totalVisitorCount} person(s)) has requested entry to ${request.hostelId} Room ${request.roomNumber}.`,
    type: 'REQUEST_CREATED',
    metadata: { requestId: request.requestId, visitorName: request.visitor.fullName, totalVisitors: request.totalVisitorCount },
    email: host?.userId?.email
  });
  return request;
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
export const cancelVisitRequest = async (requestId, user, accessToken = null) => {
  const request = await VisitRequest.findOne({ requestId });
  if (!request) {
    const err = new Error('Visit request not found.');
    err.statusCode = 404;
    throw err;
  }

  await assertRequestOwner(request, user, accessToken);

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
