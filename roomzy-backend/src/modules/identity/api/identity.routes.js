import { Router } from 'express';
import { register, verifyOtp, login, upsertProfile, getProfile, uploadProfilePicture } from './auth.controller.js';
import { authLimiter } from '../../../shared/middlewares/rateLimiter.js';
import { requireAuth } from '../../../shared/middlewares/requireAuth.js';
import { upload } from '../../../shared/middlewares/uploadMiddleware.js';

const router = Router();

router.use(authLimiter);

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);

// Profile routes (requires authentication)
router.get('/profile', requireAuth, getProfile);
router.post('/profile', requireAuth, upsertProfile);
router.post('/profile/picture', requireAuth, upload.single('picture'), uploadProfilePicture);

export default router;