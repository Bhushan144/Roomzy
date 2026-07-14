import { z } from 'zod';
import { InteractionService } from '../application/InteractionService.js';

const interactionService = new InteractionService();

const sendRequestSchema = z.object({
  targetId: z.string().length(24, "Invalid MongoDB ID"),
  type: z.enum(['ROOM', 'FLATMATE']),
  message: z.string().max(500).optional()
});

const respondRequestSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED'])
});

export const sendRequest = async (req, res, next) => {
  try {
    const validatedData = sendRequestSchema.parse(req.body);
    
    const result = await interactionService.sendRequest(
      req.user.id, 
      validatedData.targetId, 
      validatedData.type,
      validatedData.message
    );
    
    res.status(201).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const respondToRequest = async (req, res, next) => {
  try {
    const { status } = respondRequestSchema.parse(req.body);
    const interactionId = req.params.id;
    
    const result = await interactionService.respondToRequest(interactionId, req.user.id, status);
    
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

export const getInbox = async (req, res, next) => {
  try {
    // defaults to incoming
    const type = req.query.type === 'outgoing' ? 'outgoing' : 'incoming';
    const result = await interactionService.getInbox(req.user.id, type);
    
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};