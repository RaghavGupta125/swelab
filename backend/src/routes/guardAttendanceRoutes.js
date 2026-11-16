import { Router } from 'express';
import {
  checkInShift,
  checkOutShift,
  getTodayShiftStatus,
  getAllAttendance,
  getAssignableGuards,
  getShiftAssignments,
  assignGuardShift,
  removeGuardShiftAssignment
} from '../controllers/guardAttendanceController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

// Guard self-attendance
router.post('/checkin', authorizeRoles('GUARD', 'ADMIN'), checkInShift);
router.post('/checkout', authorizeRoles('GUARD', 'ADMIN'), checkOutShift);
router.get('/my-status', authorizeRoles('GUARD', 'ADMIN'), getTodayShiftStatus);

// Warden & Admin queries
router.get('/all', authorizeRoles('WARDEN', 'ADMIN'), getAllAttendance);
router.get('/guards', authorizeRoles('WARDEN', 'ADMIN'), getAssignableGuards);
router.get('/assignments', authorizeRoles('WARDEN', 'ADMIN'), getShiftAssignments);
router.post('/assignments', authorizeRoles('WARDEN', 'ADMIN'), assignGuardShift);
router.delete('/assignments/:shiftId', authorizeRoles('WARDEN', 'ADMIN'), removeGuardShiftAssignment);

export default router;
