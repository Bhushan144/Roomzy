import mongoose from 'mongoose';

const interactionSchema = new mongoose.Schema({
  initiatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // If type is ROOM, this is Listing._id. If FLATMATE, this is User._id.
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['ROOM', 'FLATMATE'],
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'DECLINED'],
    default: 'PENDING',
    index: true
  },
  message: {
    type: String,
    trim: true,
    maxLength: 500
  }
}, { timestamps: true });

// Index for fast lookups when checking existing interactions
interactionSchema.index({ initiatorId: 1, targetId: 1 });

export const Interaction = mongoose.model('Interaction', interactionSchema);