import { z } from 'zod';
import { AuthService } from '../application/AuthService.js';
import { IdentityRepository } from '../infrastructure/repositories/IdentityRepository.js';
import { CloudinaryProvider } from '../../../shared/providers/CloudinaryProvider.js';
import { FlatmateProfile } from '../infrastructure/models/FlatmateProfile.js';
import { AppError } from '../../../shared/errors/AppError.js';

const authService = new AuthService();
const identityRepo = new IdentityRepository();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['TENANT', 'OWNER'])
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await authService.register(
      validatedData.email, 
      validatedData.password, 
      validatedData.role
    );
    res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.login(validatedData.email, validatedData.password);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

// --- Profile Controller ---

const profileSchema = z.object({
  budget: z.object({
    min: z.number().min(0),
    max: z.number().min(1),
  }).refine(data => data.min <= data.max, {
    message: "Minimum budget cannot exceed maximum",
    path: ["max"]
  }).optional(),
  bio: z.string().max(500).optional(),
  fullName: z.string().min(2).max(50).optional(),
  lifestyleTraits: z.object({
    cleanliness: z.enum(['STRICT', 'MODERATE', 'RELAXED']),
    schedule: z.enum(['EARLY_BIRD', 'NIGHT_OWL', 'FLEXIBLE']),
    sociability: z.enum(['INTROVERTED', 'EXTROVERTED', 'MIXED']),
    petFriendly: z.boolean(),
  }).optional()
});

export const upsertProfile = async (req, res, next) => {
  try {
    const validatedData = profileSchema.parse(req.body);
    const result = await identityRepo.upsertFlatmateProfile(req.user.id, validatedData);
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const profile = await identityRepo.getFlatmateProfile(req.user.id);
    if (!profile) {
      return res.status(404).json({ status: 'fail', message: 'Profile not found' });
    }
    res.status(200).json({ status: 'success', data: profile });
  } catch (error) {
    next(error);
  }
};

export const uploadProfilePicture = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No image provided', 400));
    }

    const profile = await identityRepo.getFlatmateProfile(req.user.id);
    if (!profile) {
      return next(new AppError('You must create a profile first before uploading a picture.', 404));
    }

    // 1. Upload new image to Cloudinary
    const imageUrl = await CloudinaryProvider.uploadBuffer(req.file.buffer, 'roomzy_profiles');

    // 2. Update database
    const updatedProfile = await FlatmateProfile.findOneAndUpdate(
       { userId: req.user.id },
       { profilePicture: imageUrl },
       { new: true }
    );

    res.status(200).json({
      status: 'success',
      data: { profilePicture: updatedProfile.profilePicture }
    });
  } catch (error) {
    next(error);
  }
};