import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
  req.id = uuidv4(); // Assign unique Request ID
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Enforcing the requested log schema
    logger.info({
      RequestId: req.id,
      UserId: req.user?.id || 'unauthenticated',
      Module: req.baseUrl || req.path,
      Duration: `${duration}ms`,
      Status: res.statusCode
    }, `${req.method} ${req.originalUrl}`);
  });

  next();
};