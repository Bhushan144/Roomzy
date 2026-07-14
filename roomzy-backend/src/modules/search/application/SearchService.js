import { InventoryRepository } from '../../inventory/infrastructure/repositories/InventoryRepository.js';
import { IdentityRepository } from '../../identity/infrastructure/repositories/IdentityRepository.js';

import { InteractionRepository } from '../../interaction/infrastructure/repositories/InteractionRepository.js';

const inventoryRepo = new InventoryRepository();
const identityRepo = new IdentityRepository();
const interactionRepo = new InteractionRepository();

export class SearchService {
  
  async findRooms(filters, currentUserId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    // Pass the sanitized filters to the Inventory Domain
    const candidates = await inventoryRepo.searchListings(filters, skip, limit);
    
    // Fetch owner profiles for the returned candidates
    const ownerIds = candidates.map(c => c.ownerId);
    const ownerProfiles = await identityRepo.getProfilesByUserIds(ownerIds);
    const profileMap = new Map(ownerProfiles.map(p => [p.userId.toString(), p]));

    // Fetch interactions for the current user and the candidate listings
    const listingIds = candidates.map(c => c._id);
    const interactions = await interactionRepo.findInteractionsByListings(currentUserId, listingIds);
    const interactionMap = new Map(interactions.map(i => [i.targetId.toString(), i]));

    // Attach enriched data
    const enrichedCandidates = candidates.map(c => {
       return {
         ...c,
         ownerProfile: profileMap.get(c.ownerId.toString()) || null,
         interaction: interactionMap.get(c._id.toString()) || null
       };
    });

    return {
      totalReturned: candidates.length,
      page,
      candidates: enrichedCandidates
    };
  }

  async findFlatmates(filters, currentUserId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    // Inject the current user ID to ensure they don't search for themselves
    const searchFilters = {
      ...filters,
      excludeUserId: currentUserId
    };

    const candidates = await identityRepo.searchFlatmateProfiles(searchFilters, skip, limit);
    
    return {
      totalReturned: candidates.length,
      page,
      candidates
    };
  }
}