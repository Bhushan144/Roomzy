import { AppError } from '../../../shared/errors/AppError.js';
import { InventoryRepository } from '../infrastructure/repositories/InventoryRepository.js';

import { CloudinaryProvider } from '../../../shared/providers/CloudinaryProvider.js';

const repository = new InventoryRepository();

export class ListingService {
  
  async createDraft(ownerId, listingData) {
    const data = {
      ...listingData,
      ownerId,
      status: 'PUBLISHED'
    };
    return await repository.createListing(data);
  }

  async getOwnerListings(ownerId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return await repository.findListingsByOwner(ownerId, limit, skip);
  }

  async updateListing(listingId, ownerId, updateData) {
    const listing = await repository.findListingById(listingId);
    
    if (!listing) {
      throw new AppError('Listing not found', 404);
    }
    
    if (listing.ownerId.toString() !== ownerId) {
      throw new AppError('Unauthorized to modify this listing', 403);
    }

    // Prevent updates to critical fields if not in DRAFT mode (optional business rule)
    // For now, we allow updates but prevent status overriding via this method
    delete updateData.status; 
    delete updateData.ownerId;

    return await repository.updateListing(listingId, updateData);
  }

  async changeListingStatus(listingId, ownerId, targetStatus) {
    const listing = await repository.findListingById(listingId);
    
    if (!listing) {
      throw new AppError('Listing not found', 404);
    }
    
    if (listing.ownerId.toString() !== ownerId) {
      throw new AppError('Unauthorized to modify this listing', 403);
    }

    // State Machine Validation Rules
    const currentStatus = listing.status;
    const allowedTransitions = {
      'DRAFT': ['PUBLISHED', 'ARCHIVED'],
      'PUBLISHED': ['DRAFT', 'FILLED', 'ARCHIVED'],
      'FILLED': ['PUBLISHED', 'ARCHIVED'],
      'ARCHIVED': ['DRAFT']
    };

    if (!allowedTransitions[currentStatus].includes(targetStatus)) {
      throw new AppError(`Invalid state transition from ${currentStatus} to ${targetStatus}`, 400);
    }

    return await repository.updateStatus(listingId, targetStatus);
  }


  async uploadListingPhotos(listingId, ownerId, files) {
    if (!files || files.length === 0) {
      throw new AppError('No files provided for upload', 400);
    }

    const listing = await repository.findListingById(listingId);
    
    if (!listing) {
      throw new AppError('Listing not found', 404);
    }
    
    if (listing.ownerId.toString() !== ownerId) {
      throw new AppError('Unauthorized to modify this listing', 403);
    }

    // Enforce business rule: Max 10 photos total per listing
    if (listing.photos.length + files.length > 10) {
      throw new AppError('Maximum of 10 photos allowed per listing', 400);
    }

    // Upload all files concurrently to Cloudinary
    const uploadPromises = files.map(file => 
      CloudinaryProvider.uploadBuffer(file.buffer, 'roomzy_listings')
    );

    const uploadedUrls = await Promise.all(uploadPromises);

    // Save URLs to the database
    return await repository.addPhotosToListing(listingId, uploadedUrls);
  }

  async deleteListing(listingId, ownerId) {
    const listing = await repository.findListingById(listingId);
    
    if (!listing) {
      throw new AppError('Listing not found', 404);
    }
    
    if (listing.ownerId.toString() !== ownerId) {
      throw new AppError('Unauthorized to modify this listing', 403);
    }

    return await repository.deleteListing(listingId);
  }
}