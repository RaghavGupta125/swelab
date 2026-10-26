import { Router } from 'express';
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getMyNotifications);
router.patch('/:notificationId/read', markAsRead);
router.post('/mark-all-read', markAllAsRead);

export default router;
