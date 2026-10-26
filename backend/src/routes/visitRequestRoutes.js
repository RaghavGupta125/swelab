import { Router } from 'express';
import {
  createRequest,
  getRequestByTokenOrId,
  getStudentDashboardData,
  approveRequest,
  rejectRequest,
  cancelRequest
} from '../controllers/visitRequestController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Public / Visitor / Student endpoints
router.post('/', createRequest);
router.get('/:id', getRequestByTokenOrId);

// Student Host workflow endpoints
router.get('/student/feed', authenticate, authorizeRoles('STUDENT', 'ADMIN'), getStudentDashboardData);
router.post('/:requestId/approve', authenticate, authorizeRoles('STUDENT', 'ADMIN'), approveRequest);
router.post('/:requestId/reject', authenticate, authorizeRoles('STUDENT', 'ADMIN'), rejectRequest);
router.post('/:requestId/cancel', authenticate, cancelRequest);

export default router;
