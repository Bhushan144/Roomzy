import { z } from 'zod';
import { SearchService } from '../application/SearchService.js';

const searchService = new SearchService();

// Zod schema for coercing and validating query strings
const roomSearchSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  maxBudget: z.coerce.number().positive().optional(),
  availableDate: z.string().datetime().optional(),
  roomType: z.enum(['ENTIRE_PROPERTY', 'PRIVATE_ROOM', 'SHARED_ROOM']).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusInKm: z.coerce.number().min(1).max(100).default(10).optional()
}).refine(data => {
  // If lat/lng are provided, both must be present
  if ((data.lat !== undefined && data.lng === undefined) || (data.lat === undefined && data.lng !== undefined)) {
    return false;
  }
  return true;
}, { message: "Both lat and lng must be provided for location search", path: ["location"] });

const flatmateSearchSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
  minBudget: z.coerce.number().min(0).optional(),
  maxBudget: z.coerce.number().positive().optional(),
  petFriendly: z.enum(['true', 'false']).transform(val => val === 'true').optional()
}).refine(data => {
  if (data.minBudget !== undefined && data.maxBudget !== undefined) {
    return data.minBudget <= data.maxBudget;
  }
  return true;
}, {
  message: "minBudget cannot be greater than maxBudget",
  path: ["minBudget"]
});

export const searchRooms = async (req, res, next) => {
  try {
    const validatedQuery = roomSearchSchema.parse(req.query);
    
    // Extract pagination and remove them from domain filters
    const { page, limit, ...domainFilters } = validatedQuery;
    
    const result = await searchService.findRooms(domainFilters, req.user.id, page, limit);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const searchFlatmates = async (req, res, next) => {
  try {
    const validatedQuery = flatmateSearchSchema.parse(req.query);
    
    const { page, limit, ...domainFilters } = validatedQuery;
    
    const result = await searchService.findFlatmates(domainFilters, req.user.id, page, limit);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};