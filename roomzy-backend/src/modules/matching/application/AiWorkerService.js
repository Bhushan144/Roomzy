import { MatchRepository } from '../infrastructure/repositories/MatchRepository.js';
import { IdentityRepository } from '../../identity/infrastructure/repositories/IdentityRepository.js';
import { InventoryRepository } from '../../inventory/infrastructure/repositories/InventoryRepository.js';
import { GeminiProvider } from '../../../shared/providers/GeminiProvider.js';
import { logger } from '../../../shared/utils/logger.js';

const matchRepo = new MatchRepository();
const identityRepo = new IdentityRepository();
const inventoryRepo = new InventoryRepository();
const aiProvider = new GeminiProvider();

export class AiWorkerService {
  
  async processMatch(payload) {
    const { tenantId, targetId, targetType } = payload;

    // 1. Fetch the Provisional Score
    const matchRecord = await matchRepo.findScore(tenantId, targetId, targetType);
    if (!matchRecord) {
      logger.warn(`Match record not found for Tenant ${tenantId} and Target ${targetId}. Skipping.`);
      return;
    }

    if (matchRecord.status === 'FINALIZED') {
      logger.info(`Match record already finalized for Tenant ${tenantId}. Skipping.`);
      return;
    }

    // 2. Fetch Tenant Profile
    const tenantProfile = await identityRepo.getFlatmateProfile(tenantId);
    if (!tenantProfile) throw new Error('Tenant profile missing during AI scoring');

    let aiResult;

    // 3. Execute Contextual AI Strategy
    if (targetType === 'ROOM') {
      const room = await inventoryRepo.findListingById(targetId);
      aiResult = await aiProvider.evaluateRoomFit(tenantProfile, room);
    } else if (targetType === 'FLATMATE') {
      const targetProfile = await identityRepo.getFlatmateProfile(targetId);
      aiResult = await aiProvider.evaluateLifestyle(tenantProfile, targetProfile);
    }

    // 4. Calculate Hybrid Score: (70% Rule Base) + (30% AI Lifestyle)
    const baseScore = matchRecord.score;
    const finalScore = Math.round((baseScore * 0.70) + (aiResult.aiScore * 0.30));

    // Combine reasons
    const finalReason = `${matchRecord.reason} ${aiResult.reason}`;

    // 5. Finalize the Score in the Database
    await matchRepo.saveProvisionalScore({
      tenantId,
      targetId,
      targetType,
      score: finalScore,
      reason: finalReason,
      status: 'FINALIZED',
      provider: aiResult.provider,
      algorithmVersion: 'v2.0-hybrid-70-30',
      modelVersion: aiResult.provider,
      latencyMs: aiResult.latencyMs,
      confidence: aiResult.confidence,
      isFallback: aiResult.isFallback
    });

    logger.info(`Successfully finalized hybrid score for Tenant ${tenantId}`);
  }
}