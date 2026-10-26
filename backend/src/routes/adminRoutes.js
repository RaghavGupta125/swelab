import { Router } from 'express';
import {
  getAllUsers,
  updateUserStatus,
  assignUserRole,
  getSystemOverview,
  getAuditLogs
} from '../controllers/adminController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('ADMIN'));

router.get('/overview', getSystemOverview);
router.get('/users', getAllUsers);
router.patch('/users/:userId/status', updateUserStatus);
router.patch('/users/:userId/role', assignUserRole);
router.get('/audit-logs', getAuditLogs);

export default router;
