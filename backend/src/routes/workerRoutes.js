import { Router } from 'express';
import {
  listWorkers,
  registerWorker,
  logWorkerGateActivity
} from '../controllers/workerController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// View workers
router.get('/', listWorkers);

// Register workers (Warden & Admin)
router.post('/', authorizeRoles('WARDEN', 'ADMIN'), registerWorker);

// Gate check-in / check-out of workers (Guard & Admin)
router.post('/gate-activity', authorizeRoles('GUARD', 'ADMIN'), logWorkerGateActivity);

export default router;
