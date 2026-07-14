import jwt from 'jsonwebtoken';
import { config } from '../config/env.config.js';
import { AppError } from '../errors/AppError.js';

export const requireAuth = (req, res, next) => {
  try {
    // 1. Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // 2. Verify the token
    const decoded = jwt.verify(token, config.JWT_SECRET);

    // 3. Attach the decoded payload (id, role) to the request object
    req.user = decoded;

    // 4. Move to the next middleware or controller
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired. Please log in again.', 401));
    }
    
    next(error);
  }
};