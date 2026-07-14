import { Router } from 'express';
import { searchRooms, searchFlatmates } from './search.controller.js';
import { requireAuth } from '../../../shared/middlewares/requireAuth.js';
import { requireRole } from '../../../shared/middlewares/requireRole.js';

const router = Router();

// Only Tenants should be browsing the dual-feed search pipelines
router.use(requireAuth, requireRole(['TENANT']));

router.get('/rooms', searchRooms);
router.get('/flatmates', searchFlatmates);

export default router;