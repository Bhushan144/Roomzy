import { z } from 'zod';
import { MatchingService } from '../application/MatchingService.js';

const matchingService = new MatchingService();

const getScoreSchema = z.object({
  targetType: z.enum(['ROOM', 'FLATMATE'])
});

export const getCompatibilityScore = async (req, res, next) => {
  try {
    const { targetType } = getScoreSchema.parse(req.query);
    const targetId = req.params.targetId;
    const tenantId = req.user.id;

    const result = await matchingService.getProvisionalScore(tenantId, targetId, targetType);
    
    res.status(200).json({ 
      status: 'success', 
      data: {
        score: result.score,
        reason: result.reason,
        status: result.status,
        isComplete: result.status === 'FINALIZED'
      }
    });
  } catch (error) {
    next(error);
  }
};