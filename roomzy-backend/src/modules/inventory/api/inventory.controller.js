import { z } from 'zod';
import { ListingService } from '../application/ListingService.js';

const listingService = new ListingService();

const createListingSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().max(2000).optional(),
  location: z.object({
    city: z.string(),
    neighborhood: z.string(),
    coordinates: z.object({
      type: z.literal('Point').default('Point'),
      coordinates: z.tuple([z.number(), z.number()]) // [longitude, latitude]
    })
  }),
  rent: z.number().positive(),
  availableFrom: z.string().datetime(),
  roomType: z.enum(['ENTIRE_PROPERTY', 'PRIVATE_ROOM', 'SHARED_ROOM']),
  amenities: z.array(z.string()).optional()
});

const statusUpdateSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'FILLED', 'ARCHIVED'])
});

export const createDraft = async (req, res, next) => {
  try {
    const validatedData = createListingSchema.parse(req.body);
    const result = await listingService.createDraft(req.user.id, validatedData);
    res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const getMyListings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await listingService.getOwnerListings(req.user.id, page, limit);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status } = statusUpdateSchema.parse(req.body);
    const listingId = req.params.id;
    const result = await listingService.changeListingStatus(listingId, req.user.id, status);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const uploadPhotos = async (req, res, next) => {
  try {
    const listingId = req.params.id;
    const ownerId = req.user.id;
    const files = req.files; // Populated by multer

    const result = await listingService.uploadListingPhotos(listingId, ownerId, files);
    
    res.status(200).json({ 
      status: 'success', 
      message: 'Photos uploaded successfully',
      data: result 
    });
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (req, res, next) => {
  try {
    const listingId = req.params.id;
    await listingService.deleteListing(listingId, req.user.id);
    res.status(200).json({ status: 'success', message: 'Listing deleted successfully' });
  } catch (error) {
    next(error);
  }
};