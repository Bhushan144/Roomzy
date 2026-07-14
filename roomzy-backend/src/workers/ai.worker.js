import mongoose from 'mongoose';
import { config } from '../shared/config/env.config.js';
import { logger } from '../shared/utils/logger.js';
import { rabbitMQ } from '../shared/infrastructure/queue/rabbitmq.js';
import { AiWorkerService } from '../modules/matching/application/AiWorkerService.js';

const aiWorkerService = new AiWorkerService();

const startWorker = async () => {
  try {
    // 1. Establish independent connections
    await mongoose.connect(config.MONGO_URI);
    logger.info('[AI Worker] MongoDB connected');

    await rabbitMQ.connect();
    const channel = rabbitMQ.getChannel();
    logger.info('[AI Worker] RabbitMQ connected');

    // 2. Configure Consumer Limits
    // prefetch(1) ensures this worker only processes one heavy LLM request at a time
    channel.prefetch(1);
    
    logger.info(`[AI Worker] Listening for messages on queue: ${rabbitMQ.AI_QUEUE}`);

    // 3. Consume the Queue
    channel.consume(rabbitMQ.AI_QUEUE, async (msg) => {
      if (msg !== null) {
        try {
          const payload = JSON.parse(msg.content.toString());
          logger.info(`[AI Worker] Processing job for Tenant: ${payload.tenantId}`);

          await aiWorkerService.processMatch(payload);

          // Acknowledge success to remove message from queue
          channel.ack(msg);
          
        } catch (error) {
          logger.error('[AI Worker] Job processing failed', error);
          
          // Negative acknowledge: do not requeue the message to prevent infinite error loops
          // false = do not acknowledge all up to this point, false = do not requeue
          channel.nack(msg, false, false);
        }
      }
    });

    // Graceful Shutdown
    process.on('SIGTERM', async () => {
      logger.info('[AI Worker] SIGTERM received. Shutting down gracefully...');
      await rabbitMQ.close();
      await mongoose.connection.close();
      process.exit(0);
    });

  } catch (error) {
    logger.error('[AI Worker] Critical failure during startup', error);
    process.exit(1);
  }
};

startWorker();