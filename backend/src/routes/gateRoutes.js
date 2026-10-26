import { Router } from 'express';
import {
  verifyPass,
  checkInVisitor,
  checkOutVisitor,
  getActiveVisitorsList
} from '../controllers/gateController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

// Guard and Admin gate operations
router.use(authenticate);
router.use(authorizeRoles('GUARD', 'ADMIN', 'WARDEN'));

router.get('/verify', verifyPass);
router.post('/checkin', checkInVisitor);
router.post('/checkout', checkOutVisitor);
router.get('/active-visitors', getActiveVisitorsList);

export default router;
