import { verifyGatePass, recordGateEntry, recordGateExit, getActiveInsideVisitors } from '../services/gateService.js';
import { AuditLog } from '../models/AuditLog.js';

export const verifyPass = async (req, res, next) => {
  try {
    const { token, passId, requestId, phone, rollNumber } = req.query;
    const result = await verifyGatePass({ token, passId, requestId, phone, rollNumber });
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const checkInVisitor = async (req, res, next) => {
  try {
    const guardId = req.guardProfile ? req.guardProfile.guardId : req.user.userId;
    const hostelId = req.guardProfile ? req.guardProfile.assignedHostelId : req.body.hostelId;

    const { passToken, passId, requestId, manualIdNumberVerified, notes } = req.body;

    const visitRecord = await recordGateEntry({
      passToken,
      passId,
      requestId,
      guardId,
      hostelId,
      manualIdNumberVerified,
      notes
    });

    await AuditLog.create({
      action: 'GATE_ENTRY_RECORDED',
      performedBy: { userId: req.user.userId, name: req.user.name, role: req.user.role },
      targetEntity: { entityType: 'VisitRecord', entityId: visitRecord.visitId },
      details: { requestId: visitRecord.requestId, visitorName: visitRecord.visitorName, hostelId: visitRecord.hostelId }
    });

    return res.status(201).json({
      success: true,
      message: `Visitor ${visitRecord.visitorName} successfully checked in at ${visitRecord.hostelId} gate.`,
      visitRecord
    });
  } catch (error) {
    next(error);
  }
};

export const checkOutVisitor = async (req, res, next) => {
  try {
    const guardId = req.guardProfile ? req.guardProfile.guardId : req.user.userId;
    const { visitId, requestId, token, notes } = req.body;

    const visitRecord = await recordGateExit({
      visitId,
      requestId,
      token,
      guardId,
      notes
    });

    await AuditLog.create({
      action: 'GATE_EXIT_RECORDED',
      performedBy: { userId: req.user.userId, name: req.user.name, role: req.user.role },
      targetEntity: { entityType: 'VisitRecord', entityId: visitRecord.visitId },
      details: {
        visitId: visitRecord.visitId,
        visitorName: visitRecord.visitorName,
        overstayStatus: visitRecord.overstayStatus,
        durationMinutes: visitRecord.stayDurationMinutes
      }
    });

    return res.status(200).json({
      success: true,
      message: `Visitor ${visitRecord.visitorName} successfully checked out. Session closed.${visitRecord.overstayStatus ? ' (OVERSTAY FLAGGED)' : ''}`,
      visitRecord
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveVisitorsList = async (req, res, next) => {
  try {
    const hostelId = req.guardProfile ? req.guardProfile.assignedHostelId : req.query.hostelId;
    const activeVisitors = await getActiveInsideVisitors(hostelId);

    return res.status(200).json({
      success: true,
      count: activeVisitors.length,
      activeVisitors
    });
  } catch (error) {
    next(error);
  }
};
