import { Router } from 'express';
import { createDraft, getMyListings, updateStatus, deleteListing } from './inventory.controller.js';
import { requireAuth } from '../../../shared/middlewares/requireAuth.js'; 
import { requireRole } from '../../../shared/middlewares/requireRole.js';

import { upload } from '../../../shared/middlewares/uploadMiddleware.js';
import { uploadPhotos } from './inventory.controller.js';

const router = Router();

// All inventory routes require authentication and the OWNER role
router.use(requireAuth, requireRole(['OWNER']));

router.post('/listings', createDraft);
router.get('/listings/me', getMyListings);
router.patch('/listings/:id/status', updateStatus);
router.delete('/listings/:id', deleteListing);

router.post(
  '/listings/:id/photos', 
  upload.array('photos', 5), 
  uploadPhotos
);

// Future routes:
// router.patch('/listings/:id', updateListingDetails);
// router.get('/listings/:id', getSingleListingAsOwner);

export default router;