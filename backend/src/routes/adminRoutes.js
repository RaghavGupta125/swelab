import { Router } from 'express';
import {
  getAllUsers,
  updateUserStatus,
  assignUserRole,
  getSystemOverview,
  getAuditLogs,
  getDirectorySyncStatus,
  runDirectorySync
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
router.get('/directory/status', getDirectorySyncStatus);
router.post('/directory/sync', runDirectorySync);

export default router;
