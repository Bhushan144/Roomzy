import { Router } from 'express';
import { getChatHistory } from './messaging.controller.js';
import { requireAuth } from '../../../shared/middlewares/requireAuth.js';

const router = Router();

router.use(requireAuth);
router.get('/history/:interactionId', getChatHistory);

export default router;