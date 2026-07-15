import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './shared/config/env.config.js';
import { logger } from './shared/utils/logger.js';
import { requestLogger } from './shared/middlewares/requestLogger.js';
import { errorHandler } from './shared/middlewares/errorHandler.js';
import { AppError } from './shared/errors/AppError.js';
import { apiLimiter } from './shared/middlewares/rateLimiter.js';

import { createServer } from 'http';
import { SocketGateway } from './modules/messaging/infrastructure/SocketGateway.js';
import messagingRoutes from './modules/messaging/api/messaging.routes.js';

import { rabbitMQ } from './shared/infrastructure/queue/rabbitmq.js';

import identityRoutes from './modules/identity/api/identity.routes.js';
import inventoryRoutes from './modules/inventory/api/inventory.routes.js';
import searchRoutes from './modules/search/api/search.routes.js';
import matchingRoutes from './modules/matching/api/matching.routes.js';
import interactionRoutes from './modules/interaction/api/interaction.routes.js';

const app = express();

// Trust the first proxy (Render, Railway, etc.) so express-rate-limit
// correctly reads client IPs from the X-Forwarded-For header.
if (config.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// 1. Edge Layer Middleware
app.use(helmet());
app.use(cors({
  origin: config.FRONTEND_URL, // Now dynamically pulled from environment
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json({ limit: '10kb' })); // Prevent large JSON payload parsing attacks
app.use(requestLogger);

app.use('/api', apiLimiter);


app.use('/api/identity', identityRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/messaging', messagingRoutes);

// 2. Health Endpoint (Crucial for Production)
app.get('/health', async (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'degraded';
  const rmqStatus = rabbitMQ.connection ? 'healthy' : 'degraded';
  
  res.status(200).json({
    service: 'Roomzy API',
    status: (dbStatus === 'healthy' && rmqStatus === 'healthy') ? 'active' : 'degraded',
    timestamp: new Date().toISOString(),
    dependencies: {
      mongodb: dbStatus,
      rabbitmq: rmqStatus,
      cloudinary: 'configured', // Assuming configured in Milestone 4
      llm_provider: 'pending_setup'
    }
  });
});

// 3. Module Routes will go here
// app.use('/api/identity', identityRoutes);
// app.use('/api/inventory', inventoryRoutes);

// 4. Handle Unmatched Routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 5. Global Error Handler
app.use(errorHandler);

// 6. Server Initialization
const startServer = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    logger.info('MongoDB successfully connected');

    await rabbitMQ.connect();

    // Create the HTTP server explicitly so we can bind Socket.io to it
    const httpServer = createServer(app);
    
    // Initialize the Socket Gateway
    new SocketGateway(httpServer);

    // Start listening on the httpServer, not the Express app
    const server = httpServer.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
    });

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      await rabbitMQ.close();
      server.close(() => {
        mongoose.connection.close(false, () => {
          logger.info('MongoDB connection closed.');
          process.exit(0);
        });
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();