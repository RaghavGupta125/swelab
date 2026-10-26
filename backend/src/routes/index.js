import { Router } from 'express';
import authRoutes from './authRoutes.js';
import visitRequestRoutes from './visitRequestRoutes.js';
import gateRoutes from './gateRoutes.js';
import guardAttendanceRoutes from './guardAttendanceRoutes.js';
import wardenRoutes from './wardenRoutes.js';
import adminRoutes from './adminRoutes.js';
import workerRoutes from './workerRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import reportRoutes from './reportRoutes.js';
import { getISTParts } from '../utils/timeUtils.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  const istTime = getISTParts();
  res.status(200).json({
    status: 'ONLINE',
    service: 'HostGuard API',
    institution: 'LNMIIT Jaipur',
    currentTimeIST: `${istTime.dateStr} ${istTime.timeStr}:${String(istTime.seconds).padStart(2, '0')}`,
    timestamp: new Date()
  });
});

router.use('/auth', authRoutes);
router.use('/requests', visitRequestRoutes);
router.use('/gate', gateRoutes);
router.use('/attendance', guardAttendanceRoutes);
router.use('/warden', wardenRoutes);
router.use('/admin', adminRoutes);
router.use('/workers', workerRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);

export default router;
