import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../../../shared/config/env.config.js';
import { AppError } from '../../../shared/errors/AppError.js';
import { IdentityRepository } from '../infrastructure/repositories/IdentityRepository.js';

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

    // Auto-login: return JWT token directly after registration
    const payload = { id: newUser._id, role: newUser.role };
    const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' });

    return { 
      token,
      userId: newUser._id, 
      role: newUser.role,
      message: 'Registration successful.'
    };
  }

  async login(email, password) {
    const user = await repository.findUserByEmail(email);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
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