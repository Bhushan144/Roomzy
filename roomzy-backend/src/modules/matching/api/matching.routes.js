import { Router } from 'express';
import { getCompatibilityScore } from './matching.controller.js';
import { requireAuth } from '../../../shared/middlewares/requireAuth.js';
import { requireRole } from '../../../shared/middlewares/requireRole.js';

const router = Router();

// Only Tenants evaluate compatibility
router.use(requireAuth, requireRole(['TENANT']));

// Example: GET /api/matching/score/60d5ec49f1b2c8b1f8e3f9a1?targetType=ROOM
router.get('/score/:targetId', getCompatibilityScore);

export default router;