import { Worker } from '../models/Worker.js';
import { generateId, generateSecureToken } from '../utils/tokenUtils.js';
import { getNow, getISTParts } from '../utils/timeUtils.js';
import { hasActiveGuardShift } from './guardAttendanceService.js';

export const createWorker = async ({
  name,
  phoneNumber,
  workerType,
  department,
  assignedHostelId
}) => {
  const workerId = generateId('WRK');
  const qrToken = generateSecureToken('WQR');

  const worker = await Worker.create({
    workerId,
    name,
    phoneNumber,
    workerType,
    department,
    assignedHostelId,
    qrToken
  });

  return worker;
};

export const getWorkers = async (hostelId = null) => {
  const query = {};
  if (hostelId) query.assignedHostelId = hostelId;
  return Worker.find(query).sort({ name: 1 });
};

/**
 * Log worker entry or exit at gate with facility authorization check (FR-047, FR-048)
 */
export const toggleWorkerEntryExit = async ({
  workerId,
  qrToken,
  gateHostelId,
  guardId,
  action // 'ENTRY' or 'EXIT'
}) => {
  // BR-011: Active guard shift
  const isShiftActive = await hasActiveGuardShift(guardId);
  if (!isShiftActive) {
    const err = new Error('Active shift requirement: Security Guard must check in for duty shift before logging staff.');
    err.statusCode = 403;
    throw err;
  }

  let worker = null;
  if (workerId) {
    worker = await Worker.findOne({ workerId });
  } else if (qrToken) {
    worker = await Worker.findOne({ qrToken });
  }

  if (!worker) {
    const err = new Error('Worker record not found.');
    err.statusCode = 404;
    throw err;
  }

  // FR-048: Facility authorization check
  if (worker.assignedHostelId !== gateHostelId) {
    const err = new Error(`Facility Authorization Denied: Worker ${worker.name} (${worker.workerType}) is authorized for ${worker.assignedHostelId}, NOT for ${gateHostelId}.`);
    err.statusCode = 403;
    throw err;
  }

  const now = getNow();

  if (action === 'ENTRY') {
    if (worker.currentlyInside) {
      const err = new Error(`Worker ${worker.name} is already logged as inside the hostel.`);
      err.statusCode = 400;
      throw err;
    }
    worker.currentlyInside = true;
    worker.lastEntryTime = now;
    await worker.save();
    return {
      worker,
      action: 'ENTRY',
      timestamp: now,
      message: `Worker ${worker.name} (${worker.workerType} - ${worker.department}) check-in recorded at ${getISTParts(now).timeStr}.`
    };
  } else {
    // EXIT
    if (!worker.currentlyInside) {
      const err = new Error(`Worker ${worker.name} has no open check-in record.`);
      err.statusCode = 400;
      throw err;
    }
    worker.currentlyInside = false;
    worker.lastExitTime = now;
    await worker.save();
    return {
      worker,
      action: 'EXIT',
      timestamp: now,
      message: `Worker ${worker.name} check-out recorded at ${getISTParts(now).timeStr}.`
    };
  }
};
