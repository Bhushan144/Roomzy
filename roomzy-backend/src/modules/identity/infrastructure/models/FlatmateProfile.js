import mongoose from 'mongoose';

const flatmateProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  bio: {
    type: String,
    maxLength: 500
  },
  fullName: {
    type: String,
    maxLength: 50
  },
  profilePicture: {
    type: String
  },
  budget: {
    min: { type: Number },
    max: { type: Number }
  },
  lifestyleTraits: {
    cleanliness: {
      type: String,
      enum: ['STRICT', 'MODERATE', 'RELAXED']
    },
    schedule: {
      type: String,
      enum: ['EARLY_BIRD', 'NIGHT_OWL', 'FLEXIBLE']
    },
    sociability: {
      type: String,
      enum: ['INTROVERTED', 'EXTROVERTED', 'MIXED']
    },
    petFriendly: {
      type: Boolean
    }
  }
}, { timestamps: true });

export const FlatmateProfile = mongoose.model('FlatmateProfile', flatmateProfileSchema);