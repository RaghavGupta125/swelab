import { VisitRequest } from '../models/VisitRequest.js';
import { REQUEST_STATUS, BUSINESS_RULES } from '../config/constants.js';
import { getNow } from '../utils/timeUtils.js';
import { checkAndProcessActiveOverstays } from '../services/overstayService.js';

let intervalId = null;

export const runPeriodicChecks = async () => {
  try {
    const now = getNow();

    // 1. Check BR-006: 20-minute timeout for PENDING requests
    const twentyMinutesAgo = new Date(now.getTime() - BUSINESS_RULES.APPROVAL_TIMEOUT_MINUTES * 60 * 1000);
    const expiredPending = await VisitRequest.updateMany(
      {
        requestStatus: REQUEST_STATUS.PENDING,
        createdAt: { $lte: twentyMinutesAgo }
      },
      {
        requestStatus: REQUEST_STATUS.EXPIRED,
        expiredAt: now
      }
    );

    if (expiredPending.modifiedCount > 0) {
      console.log(`[HostGuard Job] Auto-expired ${expiredPending.modifiedCount} pending request(s) exceeding 20m window.`);
    }

    // 2. Check requests whose expectedExitTime has elapsed without approval or entry
    const pastWindowRequests = await VisitRequest.updateMany(
      {
        requestStatus: { $in: [REQUEST_STATUS.PENDING, REQUEST_STATUS.DRAFT] },
        expectedExitTime: { $lt: now }
      },
      {
        requestStatus: REQUEST_STATUS.EXPIRED,
        expiredAt: now
      }
    );

    if (pastWindowRequests.modifiedCount > 0) {
      console.log(`[HostGuard Job] Auto-expired ${pastWindowRequests.modifiedCount} request(s) whose window elapsed.`);
    }

    // 3. Dynamic Overstay scan for all active visitors
    await checkAndProcessActiveOverstays();
  } catch (err) {
    console.error('[HostGuard Job Error]:', err.message);
  }
};

export const startScheduler = (intervalMs = 60000) => {
  if (intervalId) clearInterval(intervalId);
  console.log(`[HostGuard Scheduler] Started background job (Interval: ${intervalMs / 1000}s).`);
  // Run once immediately
  runPeriodicChecks();
  intervalId = setInterval(runPeriodicChecks, intervalMs);
};

export const stopScheduler = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[HostGuard Scheduler] Stopped background job.');
  }
};
