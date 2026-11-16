import { Router } from 'express';
import { login, logout, getMe, getSsoConfig, startSso, finishSso } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/login', login);
router.get('/sso/config', getSsoConfig);
router.get('/sso/start', startSso);
router.get('/sso/callback', finishSso);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

export default router;
