import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  description: {
    type: String,
    trim: true,
    maxLength: 2000
  },
  location: {
    city: { type: String, required: true, index: true },
    neighborhood: { type: String, required: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true } // [longitude, latitude]
    }
  },
  rent: {
    type: Number,
    required: true,
    min: 0
  },
  availableFrom: {
    type: Date,
    required: true
  },
  roomType: {
    type: String,
    enum: ['ENTIRE_PROPERTY', 'PRIVATE_ROOM', 'SHARED_ROOM'],
    required: true
  },
  amenities: [{
    type: String,
    trim: true
  }],
  photos: [{
    type: String, // CDN URLs
  }],
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'FILLED', 'ARCHIVED'],
    default: 'PUBLISHED',
    index: true
  }
}, { timestamps: true });

// Compound index for the Discovery Engine (Milestone 5)
listingSchema.index({ status: 1, 'location.city': 1, rent: 1 });
listingSchema.index({ 'location.coordinates': '2dsphere' });

export const Listing = mongoose.model('Listing', listingSchema);