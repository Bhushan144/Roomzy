import { z } from 'zod';
import { MessageService } from '../application/MessageService.js';

const messageService = new MessageService();

const historyQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50)
});

export const getChatHistory = async (req, res, next) => {
  try {
    const { page, limit } = historyQuerySchema.parse(req.query);
    const interactionId = req.params.interactionId;
    
    const result = await messageService.getChatHistory(interactionId, req.user.id, page, limit);
    
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};