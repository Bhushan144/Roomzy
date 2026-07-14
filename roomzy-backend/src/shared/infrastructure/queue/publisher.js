import { rabbitMQ } from './rabbitmq.js';
import { logger } from '../../utils/logger.js';

export const publishToAiQueue = async (payload) => {
  try {
    const channel = rabbitMQ.getChannel();
    const messageBuffer = Buffer.from(JSON.stringify(payload));
    
    // persistent: true ensures the message survives a broker restart
    channel.sendToQueue(rabbitMQ.AI_QUEUE, messageBuffer, { persistent: true });
    
    logger.info({ 
      action: 'publish_ai_queue', 
      tenantId: payload.tenantId, 
      targetId: payload.targetId 
    }, 'Dispatched job to AI queue');
  } catch (error) {
    logger.error('Failed to publish to AI queue', error);
    // Depending on business rules, you might want to throw here or fail silently
  }
};

export const publishToNotificationQueue = async (payload) => {
  try {
    const channel = rabbitMQ.getChannel();
    const messageBuffer = Buffer.from(JSON.stringify(payload));
    
    channel.sendToQueue(rabbitMQ.NOTIFICATION_QUEUE, messageBuffer, { persistent: true });
    
    logger.info({ 
      action: 'publish_notification_queue', 
      type: payload.type,
      targetId: payload.targetId
    }, 'Dispatched job to Notification queue');
  } catch (error) {
    logger.error('Failed to publish to Notification queue', error);
  }
};