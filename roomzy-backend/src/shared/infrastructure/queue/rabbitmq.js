import amqp from 'amqplib';
import { config } from '../../config/env.config.js';
import { logger } from '../../utils/logger.js';

class RabbitMQConnection {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.AI_QUEUE = 'ai_scoring_queue';
    this.NOTIFICATION_QUEUE = 'notification_queue';
  }

  async connect() {
    try {
      if (!config.RABBITMQ_URI) {
        throw new Error('RABBITMQ_URI is not defined in environment variables');
      }

      this.connection = await amqp.connect(config.RABBITMQ_URI);
      
      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error', err);
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed. In production, rely on process manager to restart.');
        process.exit(1); 
      });

      this.channel = await this.connection.createChannel();

      // Assert queues: durable ensures queues survive broker restarts
      await this.channel.assertQueue(this.AI_QUEUE, { durable: true });
      await this.channel.assertQueue(this.NOTIFICATION_QUEUE, { durable: true });

      logger.info('RabbitMQ connected and queues asserted successfully');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ', error);
      throw error;
    }
  }

  getChannel() {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not initialized. Call connect() first.');
    }
    return this.channel;
  }

  async close() {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    logger.info('RabbitMQ connection gracefully closed');
  }
}

export const rabbitMQ = new RabbitMQConnection();