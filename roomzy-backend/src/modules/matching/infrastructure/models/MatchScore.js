import mongoose from 'mongoose';

const matchScoreSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  targetType: {
    type: String,
    enum: ['ROOM', 'FLATMATE'],
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PROVISIONAL', 'FINALIZED'],
    default: 'PROVISIONAL'
  },
  // AI Metadata (Populated later by the worker)
  provider: String,
  algorithmVersion: String,
  modelVersion: String,
  promptVersion: String,
  latencyMs: Number,
  confidence: Number,
  isFallback: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Compound index for fast lookups of existing scores
matchScoreSchema.index({ tenantId: 1, targetId: 1, targetType: 1 }, { unique: true });

export const MatchScore = mongoose.model('MatchScore', matchScoreSchema);