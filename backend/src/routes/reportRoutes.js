import { Router } from 'express';
import { getHistoricalVisits, getDailyReport } from '../controllers/reportController.js';
import { authenticate, authorizeRoles } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);
router.use(authorizeRoles('WARDEN', 'ADMIN'));

router.get('/history', getHistoricalVisits);
router.get('/daily-summary', getDailyReport);

export default router;
