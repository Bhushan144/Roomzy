import { AppError } from '../../../shared/errors/AppError.js';
import { MatchRepository } from '../infrastructure/repositories/MatchRepository.js';
import { IdentityRepository } from '../../identity/infrastructure/repositories/IdentityRepository.js';
import { InventoryRepository } from '../../inventory/infrastructure/repositories/InventoryRepository.js';
import { RuleEngine } from '../domain/RuleEngine.js';
import { publishToAiQueue } from '../../../shared/infrastructure/queue/publisher.js';

const matchRepo = new MatchRepository();
const identityRepo = new IdentityRepository();
const inventoryRepo = new InventoryRepository();

export class MatchingService {
  
  async getProvisionalScore(tenantId, targetId, targetType) {
    // 1. Check Cache
    const existingScore = await matchRepo.findScore(tenantId, targetId, targetType);
    if (existingScore) {
      // If the AI has already finalized it, return the rich score
      if (existingScore.status === 'FINALIZED') {
        return existingScore;
      }
      // If it's still provisional, return it but don't re-trigger the queue
      return existingScore;
    }

    // 2. Fetch Tenant Profile
    const tenantProfile = await identityRepo.getFlatmateProfile(tenantId);
    if (!tenantProfile) {
      throw new AppError('You must complete your Flatmate Profile to get compatibility scores.', 400);
    }

    let ruleResult;

    // 3. Execute Deterministic Math based on target
    if (targetType === 'ROOM') {
      const listing = await inventoryRepo.findListingById(targetId);
      if (!listing) throw new AppError('Listing not found', 404);
      ruleResult = RuleEngine.calculateRoomScore(tenantProfile, listing);
    } else if (targetType === 'FLATMATE') {
      const targetProfile = await identityRepo.getFlatmateProfile(targetId);
      if (!targetProfile) throw new AppError('Target profile not found', 404);
      ruleResult = RuleEngine.calculateFlatmateScore(tenantProfile, targetProfile);
    } else {
      throw new AppError('Invalid target type', 400);
    }

    // 4. Save Provisional Score (70% weight baseline)
    const provisionalRecord = await matchRepo.saveProvisionalScore({
      tenantId,
      targetId,
      targetType,
      score: ruleResult.score,
      reason: ruleResult.reason,
      algorithmVersion: 'v1.0-rules-only'
    });

    // 5. Trigger Async AI Worker (Non-blocking)
    publishToAiQueue({
      matchId: provisionalRecord._id,
      tenantId,
      targetId,
      targetType
    });

    // 6. Return immediate response
    return provisionalRecord;
  }
}