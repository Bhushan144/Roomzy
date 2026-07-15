import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../../../shared/config/env.config.js';
import { logger } from '../../../shared/utils/logger.js';
import { InteractionRepository } from '../../interaction/infrastructure/repositories/InteractionRepository.js';
import { MessageService } from '../application/MessageService.js';

const interactionRepo = new InteractionRepository();
const messageService = new MessageService();

export class SocketGateway {
  constructor(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: [config.FRONTEND_URL, 'https://roomzy4u.vercel.app'],
        methods: ['GET', 'POST']
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) return next(new Error('Authentication error: Token missing'));

        const decoded = jwt.verify(token, config.JWT_SECRET);
        socket.user = decoded; // Attach user to socket instance

        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', async (socket) => {
      logger.info(`Socket connected: User ${socket.user.id}`);

      // 1. Authorize & Join Rooms
      try {
        const acceptedInteractions = await interactionRepo.getAcceptedInteractionsForUser(socket.user.id);
        
        acceptedInteractions.forEach(interaction => {
          const roomName = `chat_${interaction._id.toString()}`;
          socket.join(roomName);
          logger.info(`User ${socket.user.id} joined room ${roomName}`);
        });
      } catch (error) {
        logger.error(`Failed to load chat rooms for user ${socket.user.id}`);
        socket.disconnect();
        return;
      }

      // 2. Explicitly join a room (useful if interaction was accepted after socket connected)
      socket.on('join_room', (interactionId) => {
        const roomName = `chat_${interactionId}`;
        socket.join(roomName);
        logger.info(`User ${socket.user.id} explicitly joined room ${roomName}`);
      });

      // 3. Handle Incoming Messages
      socket.on('send_message', async (payload, callback) => {
        try {
          const { interactionId, content } = payload;
          
          // Execute Business Logic & Database Write
          const savedMessage = await messageService.processNewMessage(
            interactionId,
            socket.user.id,
            content
          );

          const roomName = `chat_${interactionId}`;
          
          // Broadcast to everyone in the room (including the sender for cross-device sync)
          this.io.to(roomName).emit('new_message', savedMessage);

          // Acknowledge receipt to the specific client that sent it
          if (typeof callback === 'function') {
            callback({ status: 'ok', data: savedMessage });
          }
          
        } catch (error) {
          logger.error('Socket send_message error', error);
          if (typeof callback === 'function') {
            callback({ status: 'error', message: error.message });
          }
        }
      });

      socket.on('disconnect', () => {
        logger.info(`Socket disconnected: User ${socket.user.id}`);
      });
    });
  }
}