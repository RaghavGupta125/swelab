import { createWorker, getWorkers, toggleWorkerEntryExit } from '../services/workerService.js';
import { AuditLog } from '../models/AuditLog.js';

export const listWorkers = async (req, res, next) => {
  try {
    const hostelId = req.wardenProfile ? req.wardenProfile.assignedHostelId : req.query.hostelId;
    const workers = await getWorkers(hostelId);
    return res.status(200).json({
      success: true,
      workers
    });
  } catch (error) {
    next(error);
  }
};

export const registerWorker = async (req, res, next) => {
  try {
    const { name, phoneNumber, workerType, department, assignedHostelId } = req.body;
    const hostelId = assignedHostelId || (req.wardenProfile ? req.wardenProfile.assignedHostelId : 'BH1');

    const worker = await createWorker({
      name,
      phoneNumber,
      workerType,
      department,
      assignedHostelId: hostelId
    });

    await AuditLog.create({
      action: 'WORKER_REGISTERED',
      performedBy: { userId: req.user.userId, name: req.user.name, role: req.user.role },
      targetEntity: { entityType: 'Worker', entityId: worker.workerId },
      details: { name, workerType, department, hostelId }
    });

    return res.status(201).json({
      success: true,
      message: `Worker ${name} (${workerType}) registered successfully.`,
      worker
    });
  } catch (error) {
    next(error);
  }
};

export const logWorkerGateActivity = async (req, res, next) => {
  try {
    const guardId = req.guardProfile ? req.guardProfile.guardId : req.user.userId;
    const gateHostelId = req.guardProfile ? req.guardProfile.assignedHostelId : req.body.hostelId;
    const { workerId, qrToken, action } = req.body;

    const result = await toggleWorkerEntryExit({
      workerId,
      qrToken,
      gateHostelId,
      guardId,
      action
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
