import { Router } from 'express';
import {
  createRequest,
  getRequestByTokenOrId,
  getStudentDashboardData,
  approveRequest,
  rejectRequest,
  cancelRequest,
  updateRequest,
  submitDraft
} from '../controllers/visitRequestController.js';
import { authenticate, authenticateOptional, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Public / Visitor / Student endpoints
// Student Host workflow endpoints
router.get('/student/feed', authenticate, authorizeRoles('STUDENT', 'ADMIN'), getStudentDashboardData);
router.post('/', authenticateOptional, createRequest);
router.put('/:requestId', authenticateOptional, updateRequest);
router.post('/:requestId/submit', authenticateOptional, submitDraft);
router.get('/:id', authenticateOptional, getRequestByTokenOrId);
router.post('/:requestId/approve', authenticate, authorizeRoles('STUDENT', 'ADMIN'), approveRequest);
router.post('/:requestId/reject', authenticate, authorizeRoles('STUDENT', 'ADMIN'), rejectRequest);
router.post('/:requestId/cancel', authenticateOptional, cancelRequest);

export default router;
