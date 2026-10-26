import { Router } from 'express';
import {
  checkInShift,
  checkOutShift,
  getTodayShiftStatus,
  getAllAttendance
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

export default router;
