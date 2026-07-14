import mongoose from 'mongoose';

const otpRecordSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  otp: {
    type: String,
    required: true
  },
  // The TTL Index: MongoDB will automatically delete this document 300 seconds (5 mins) after creation
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 
  }
});

export const OtpRecord = mongoose.model('OtpRecord', otpRecordSchema);