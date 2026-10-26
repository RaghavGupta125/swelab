import { VisitRequest } from '../models/VisitRequest.js';
import { QRPass } from '../models/QRPass.js';
import { StudentProfile } from '../models/StudentProfile.js';
import {
  createVisitRequest,
  approveVisitRequest,
  rejectVisitRequest,
  cancelVisitRequest,
  getActiveVisitorCountForHost
} from '../services/visitRequestService.js';
import { REQUEST_STATUS } from '../config/constants.js';
import { AuditLog } from '../models/AuditLog.js';

export const createRequest = async (req, res, next) => {
  try {
    const isStudent = req.user && req.user.role === 'STUDENT';
    const initiatorRole = isStudent ? 'STUDENT' : 'VISITOR';
    const initiatorUser = isStudent ? req.studentProfile : null;

    const request = await createVisitRequest(req.body, initiatorRole, initiatorUser);

    return res.status(201).json({
      success: true,
      message: request.requestStatus === REQUEST_STATUS.DRAFT
        ? 'Draft request saved successfully.'
        : 'Visit request submitted successfully. Awaiting host student approval.',
      request
    });
  } catch (error) {
    next(error);
  }
};

export const getRequestByTokenOrId = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Can query by requestId or accessToken
    const request = await VisitRequest.findOne({
      $or: [
        { requestId: id },
        { accessToken: id }
      ]
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Visit request not found.'
      });
    }

    let qrPass = null;
    if (request.requestStatus === REQUEST_STATUS.APPROVED) {
      qrPass = await QRPass.findOne({ requestId: request.requestId });
    }

    return res.status(200).json({
      success: true,
      request,
      qrPass
    });
  } catch (error) {
    next(error);
  }
};

export const getStudentDashboardData = async (req, res, next) => {
  try {
    if (!req.studentProfile) {
      return res.status(400).json({
        success: false,
        message: 'Student profile missing for current user.'
      });
    }

    const rollNumber = req.studentProfile.rollNumber;

    const [pendingRequests, historicalRequests, activeVisitorCount] = await Promise.all([
      VisitRequest.find({
        hostStudentRollNumber: rollNumber,
        requestStatus: REQUEST_STATUS.PENDING
      }).sort({ createdAt: -1 }),
      VisitRequest.find({
        hostStudentRollNumber: rollNumber,
        requestStatus: { $ne: REQUEST_STATUS.PENDING }
      }).sort({ createdAt: -1 }).limit(50),
      getActiveVisitorCountForHost(rollNumber)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        studentProfile: req.studentProfile,
        activeVisitorCount,
        maxQuota: 5,
        pendingRequests,
        historicalRequests
      }
    });
  } catch (error) {
    next(error);
  }
};

export const approveRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { request, qrPass } = await approveVisitRequest(requestId, req.user);

    await AuditLog.create({
      action: 'APPROVE_VISIT_REQUEST',
      performedBy: { userId: req.user.userId, name: req.user.name, role: req.user.role },
      targetEntity: { entityType: 'VisitRequest', entityId: requestId },
      details: { rollNumber: request.hostStudentRollNumber, totalVisitors: request.totalVisitorCount }
    });

    return res.status(200).json({
      success: true,
      message: 'Visit request approved successfully. QR pass issued.',
      request,
      qrPass
    });
  } catch (error) {
    next(error);
  }
};

export const rejectRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const request = await rejectVisitRequest(requestId, req.user, reason);

    await AuditLog.create({
      action: 'REJECT_VISIT_REQUEST',
      performedBy: { userId: req.user.userId, name: req.user.name, role: req.user.role },
      targetEntity: { entityType: 'VisitRequest', entityId: requestId },
      details: { reason }
    });

    return res.status(200).json({
      success: true,
      message: 'Visit request rejected.',
      request
    });
  } catch (error) {
    next(error);
  }
};

export const cancelRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const request = await cancelVisitRequest(requestId, req.user);

    return res.status(200).json({
      success: true,
      message: 'Visit request cancelled.',
      request
    });
  } catch (error) {
    next(error);
  }
};
