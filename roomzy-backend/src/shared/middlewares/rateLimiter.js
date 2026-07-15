import rateLimit from 'express-rate-limit';
import { config } from '../config/env.config.js';

// 1. Generic API Limiter (100 requests per 15 minutes)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Strict Auth Limiter (5 requests per 15 minutes in prod, 100 in dev)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.NODE_ENV === 'development' ? 100 : 20,
  message: {
    status: 'error',
    message: 'Too many login/registration attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});