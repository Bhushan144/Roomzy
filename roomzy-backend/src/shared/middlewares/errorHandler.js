import { logger } from '../utils/logger.js';
import { config } from '../config/env.config.js';

export const errorHandler = (err, req, res, next) => {
  // Handle Zod Validation Errors
  if (err.name === 'ZodError') {
    err.statusCode = 400;
    const issues = err.issues || err.errors || [];
    err.message = issues.map(e => `${(e.path || []).join('.')}: ${e.message}`).join(', ') || 'Validation failed';
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.statusCode >= 400 && err.statusCode < 500 ? 'fail' : 'error';

  // Log the error securely
  logger.error({
    RequestId: req.id,
    message: err.message,
    stack: config.NODE_ENV === 'development' ? err.stack : undefined,
  });

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(config.NODE_ENV === 'development' && { stack: err.stack }),
  });
};