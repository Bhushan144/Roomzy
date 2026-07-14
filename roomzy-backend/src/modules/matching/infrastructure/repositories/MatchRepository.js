import { MatchScore } from '../models/MatchScore.js';

export class MatchRepository {
  async findScore(tenantId, targetId, targetType) {
    return await MatchScore.findOne({ tenantId, targetId, targetType });
  }

  async saveProvisionalScore(scoreData) {
    return await MatchScore.findOneAndUpdate(
      { 
        tenantId: scoreData.tenantId, 
        targetId: scoreData.targetId, 
        targetType: scoreData.targetType 
      },
      { $set: { status: 'PROVISIONAL', ...scoreData } },
      { new: true, upsert: true }
    );
  }
}