import { OverstayAlert } from '../models/OverstayAlert.js';
import { VisitRecord } from '../models/VisitRecord.js';
import { computeOverstay, getNow, getISTParts } from '../utils/timeUtils.js';
import { generateId } from '../utils/tokenUtils.js';
import { createNotification } from './notificationService.js';

export const recordOverstayIncident = async ({
  visitId,
  requestId,
  hostelId,
  studentRollNumber,
  visitorName,
  expectedExitTime,
  detectedAt = getNow()
}) => {
  // Prevent duplicate alert for the same visit
  const existing = await OverstayAlert.findOne({ visitId });
  if (existing) {
    return existing;
  }

  const alertId = generateId('OVALT');
  const alert = await OverstayAlert.create({
    alertId,
    visitId,
    requestId,
    hostelId,
    studentRollNumber,
    visitorName,
    expectedExitTime,
    detectedAt,
    status: 'OPEN'
  });

  // FR-041: Dispatch notifications to host student, guards and warden
  await createNotification({
    recipientUserId: studentRollNumber,
    recipientRole: 'STUDENT',
    title: 'URGENT: Visitor Overstay Alert',
    message: `Your visitor ${visitorName} has exceeded their permitted visit window (expected: ${getISTParts(expectedExitTime).timeStr}) at ${hostelId}. Please ensure they check out at the gate immediately.`,
    type: 'OVERSTAY_ALERT',
    metadata: { alertId, visitId, studentRollNumber }
  });

  await createNotification({
    recipientUserId: `WARDEN_${hostelId}`,
    recipientRole: 'WARDEN',
    title: `Overstay Flagged in ${hostelId}`,
    message: `Visitor ${visitorName} hosted by ${studentRollNumber} has overstayed. Scheduled exit was ${getISTParts(expectedExitTime).timeStr}.`,
    type: 'OVERSTAY_ALERT',
    metadata: { alertId, visitId, hostelId, studentRollNumber }
  });

  return alert;
};

/**
 * Scan all active inside visitors, dynamically detect overstays and create alerts if needed (FR-038, FR-039)
 */
export const checkAndProcessActiveOverstays = async (hostelId = null) => {
  const query = { exitTime: null };
  if (hostelId) query.hostelId = hostelId;

  const activeVisits = await VisitRecord.find(query);
  const now = getNow();
  const flagged = [];

  for (const visit of activeVisits) {
    const isOverstay = computeOverstay(visit.expectedExitTime, now);
    if (isOverstay) {
      if (!visit.overstayStatus) {
        visit.overstayStatus = true;
        await visit.save();
      }

      const alert = await recordOverstayIncident({
        visitId: visit.visitId,
        requestId: visit.requestId,
        hostelId: visit.hostelId,
        studentRollNumber: visit.hostStudentRollNumber,
        visitorName: visit.visitorName,
        expectedExitTime: visit.expectedExitTime,
        detectedAt: now
      });

      flagged.push({ visit, alert });
    }
  }

  return flagged;
};

export const getOverstayAlerts = async (hostelId = null, status = null) => {
  const query = {};
  if (hostelId) query.hostelId = hostelId;
  if (status) query.status = status;
  return OverstayAlert.find(query).sort({ detectedAt: -1 });
};

export const acknowledgeOverstayAlert = async (alertId, wardenUser, notes = '') => {
  const alert = await OverstayAlert.findOne({ alertId });
  if (!alert) {
    const err = new Error('Alert not found.');
    err.statusCode = 404;
    throw err;
  }

  alert.status = 'ACKNOWLEDGED';
  alert.acknowledgedBy = wardenUser.userId || wardenUser.name;
  alert.acknowledgedAt = getNow();
  if (notes) alert.resolutionNotes = notes;

  await alert.save();
  return alert;
};
