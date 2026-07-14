import { Router } from 'express';
import { sendRequest, respondToRequest, getInbox } from './interaction.controller.js';
import { requireAuth } from '../../../shared/middlewares/requireAuth.js';

const router = Router();

// All interactions require authentication
router.use(requireAuth);

router.post('/request', sendRequest);
router.patch('/:id/respond', respondToRequest);
router.get('/inbox', getInbox);

export default router;