import { Router } from 'express';
import {
  getWardenDashboard,
  getAlerts,
  acknowledgeAlert,
  updateStudentAccountStatus
} from '../controllers/wardenController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('WARDEN', 'ADMIN'));

router.get('/dashboard', getWardenDashboard);
router.get('/alerts', getAlerts);
router.post('/alerts/:alertId/acknowledge', acknowledgeAlert);
router.patch('/students/:rollNumber/status', updateStudentAccountStatus);

export default router;
