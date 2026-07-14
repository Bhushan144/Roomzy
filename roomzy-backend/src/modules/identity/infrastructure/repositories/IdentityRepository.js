import { User } from '../models/User.js';
import { FlatmateProfile } from '../models/FlatmateProfile.js';
import { OtpRecord } from '../models/OtpRecord.js';

export class IdentityRepository {
  // User Methods
  async createUser(userData) {
    const user = new User(userData);
    return await user.save();
  }

  async findUserByEmail(email) {
    return await User.findOne({ email });
  }

  async markEmailVerified(userId) {
    return await User.findByIdAndUpdate(userId, { isEmailVerified: true }, { new: true });
  }

  // OTP Methods
  async saveOtp(email, otpHash) {
    // Delete any existing OTP for this email to prevent spam
    await OtpRecord.deleteMany({ email });
    const record = new OtpRecord({ email, otp: otpHash });
    return await record.save();
  }

  async findOtpRecord(email) {
    return await OtpRecord.findOne({ email });
  }

  async deleteOtpRecord(email) {
    return await OtpRecord.deleteMany({ email });
  }

  // Profile Methods
  async upsertFlatmateProfile(userId, profileData) {
    return await FlatmateProfile.findOneAndUpdate(
      { userId },
      { $set: profileData },
      { new: true, upsert: true }
    );
  }

  async getFlatmateProfile(userId) {
    return await FlatmateProfile.findOne({ userId });
  }

  async getProfilesByUserIds(userIds) {
    return await FlatmateProfile.find({ userId: { $in: userIds } }).lean();
  }

  async searchFlatmateProfiles(filters, skip = 0, limit = 10) {
    // Only return TENANT profiles in flatmate search
    const tenantUsers = await User.find({ role: 'TENANT' }).select('_id').lean();
    const tenantUserIds = tenantUsers.map(u => u._id);

    const query = {
      userId: { $in: tenantUserIds }
    };

    // Do not return the user who is doing the searching
    if (filters.excludeUserId) {
      query.userId.$ne = filters.excludeUserId;
    }

    // Budget Intersection Logic:
    // Target's minimum must be <= Searcher's maximum
    if (filters.maxBudget !== undefined) {
      query['budget.min'] = { $lte: filters.maxBudget };
    }
    // Target's maximum must be >= Searcher's minimum
    if (filters.minBudget !== undefined) {
      query['budget.max'] = { $gte: filters.minBudget };
    }

    // Strict Dealbreakers
    if (typeof filters.petFriendly === 'boolean') {
      query['lifestyleTraits.petFriendly'] = filters.petFriendly;
    }

    return await FlatmateProfile.find(query)
      .populate('userId', 'email role') // Join basic user info, exclude hash
      .select('-__v')
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async findUserById(userId) {
    return await User.findById(userId).select('-passwordHash');
  }
}