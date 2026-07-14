import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../../../shared/config/env.config.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { IdentityRepository } from '../infrastructure/repositories/IdentityRepository.js';
import { rabbitMQ } from '../../../shared/infrastructure/queue/rabbitmq.js';

const repository = new IdentityRepository();

export class AuthService {
  
  async register(email, password, role) {
    const existingUser = await repository.findUserByEmail(email);
    if (existingUser) {
      throw new AppError('Email is already registered', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await repository.createUser({
      email,
      passwordHash,
      role
    });

    // Generate 6-digit OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(rawOtp, 10);
    
    await repository.saveOtp(email, otpHash);

    // In production, send OTP via email through the notification queue
    if (config.NODE_ENV === 'production') {
      const channel = rabbitMQ.getChannel();
      channel.sendToQueue(
        rabbitMQ.NOTIFICATION_QUEUE,
        Buffer.from(JSON.stringify({ type: 'SEND_OTP', email, otp: rawOtp })),
        { persistent: true }
      );
    }

    return { 
      userId: newUser._id, 
      message: 'Registration successful. Please verify OTP.',
      ...(config.NODE_ENV !== 'production' && { dev_otp: rawOtp })
    };
  }

  async verifyOtp(email, providedOtp) {
    const record = await repository.findOtpRecord(email);
    if (!record) {
      throw new AppError('OTP expired or invalid', 400);
    }

    const isValid = await bcrypt.compare(providedOtp, record.otp);
    if (!isValid) {
      throw new AppError('Invalid OTP', 400);
    }

    const user = await repository.findUserByEmail(email);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await repository.markEmailVerified(user._id);
    await repository.deleteOtpRecord(email);

    return { message: 'Email verified successfully' };
  }

  async login(email, password) {
    const user = await repository.findUserByEmail(email);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.isEmailVerified) {
      throw new AppError('Please verify your email before logging in', 403);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' });

    return { token, role: user.role, userId: user._id };
  }
}