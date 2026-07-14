import { Listing } from '../models/Listing.js';

export class InventoryRepository {
  async createListing(listingData) {
    const listing = new Listing(listingData);
    return await listing.save();
  }

  async findListingById(listingId) {
    return await Listing.findById(listingId);
  }

  async findListingsByOwner(ownerId, limit = 10, skip = 0) {
    return await Listing.find({ ownerId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
  }

  async updateListing(listingId, updateData) {
    return await Listing.findByIdAndUpdate(
      listingId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  async updateStatus(listingId, status) {
    return await Listing.findByIdAndUpdate(
      listingId,
      { status },
      { new: true }
    );
  }

  async addPhotosToListing(listingId, photoUrls) {
    return await Listing.findByIdAndUpdate(
      listingId,
      { $push: { photos: { $each: photoUrls } } },
      { new: true, runValidators: true }
    );
  }

  async searchListings(filters, skip = 0, limit = 10) {
    const query = {
      status: 'PUBLISHED'
    };

    if (filters.maxBudget) {
      query.rent = { $lte: filters.maxBudget };
    }

    if (filters.availableDate) {
      query.availableFrom = { $lte: new Date(filters.availableDate) };
    }

    if (filters.roomType) {
      query.roomType = filters.roomType;
    }

    // Geospatial indexing
    if (filters.lng && filters.lat && filters.radiusInKm) {
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [filters.lng, filters.lat]
          },
          $maxDistance: filters.radiusInKm * 1000 // Convert km to meters
        }
      };
    }

    return await Listing.find(query)
      .select('-__v') // Exclude internal versioning
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for read-only performance (returns plain JS objects, not Mongoose docs)
  }

  async deleteListing(listingId) {
    return await Listing.findByIdAndDelete(listingId);
  }
}