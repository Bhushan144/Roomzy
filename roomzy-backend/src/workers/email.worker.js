import mongoose from 'mongoose';
import { config } from '../shared/config/env.config.js';
import { logger } from '../shared/utils/logger.js';
import { rabbitMQ } from '../shared/infrastructure/queue/rabbitmq.js';
import { NotificationWorkerService } from '../modules/notification/application/NotificationWorkerService.js';

const notificationWorkerService = new NotificationWorkerService();

const startWorker = async () => {
  try {
    // 1. Establish independent connections
    await mongoose.connect(config.MONGO_URI);
    logger.info('[Email Worker] MongoDB connected');

    await rabbitMQ.connect();
    const channel = rabbitMQ.getChannel();
    logger.info('[Email Worker] RabbitMQ connected');

    // 2. Configure Consumer Limits
    // Email sending is fast. We can process up to 10 concurrently.
    channel.prefetch(10);
    
    logger.info(`[Email Worker] Listening for messages on queue: ${rabbitMQ.NOTIFICATION_QUEUE}`);

    // 3. Consume the Queue
    channel.consume(rabbitMQ.NOTIFICATION_QUEUE, async (msg) => {
      if (msg !== null) {
        try {
          const payload = JSON.parse(msg.content.toString());
          logger.info(`[Email Worker] Processing notification type: ${payload.type}`);

          await notificationWorkerService.processNotification(payload);

          // Acknowledge success
          channel.ack(msg);
          
        } catch (error) {
          logger.error(`[Email Worker] Notification processing failed: ${error.message}`);
          // Negative acknowledge: do not requeue the message to prevent infinite error loops
          // false = do not acknowledge all up to this point, false = do not requeue
          channel.nack(msg, false, false);
        }
      }
    });

    // Graceful Shutdown
    process.on('SIGTERM', async () => {
      logger.info('[Email Worker] SIGTERM received. Shutting down gracefully...');
      await rabbitMQ.close();
      await mongoose.connection.close();
      process.exit(0);
    });

  } catch (error) {
    logger.error('[Email Worker] Critical failure during startup', error);
    process.exit(1);
  }
};

startWorker();