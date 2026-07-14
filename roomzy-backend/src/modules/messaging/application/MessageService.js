import { AppError } from '../../../shared/errors/AppError.js';
import { MessageRepository } from '../infrastructure/repositories/MessageRepository.js';
import { InteractionRepository } from '../../interaction/infrastructure/repositories/InteractionRepository.js';
import { FlatmateProfile } from '../../identity/infrastructure/models/FlatmateProfile.js';

const messageRepo = new MessageRepository();
const interactionRepo = new InteractionRepository();

export class MessageService {
  
  async processNewMessage(interactionId, senderId, content) {
    const interaction = await interactionRepo.findInteractionById(interactionId);
    
    if (!interaction) {
      throw new AppError('Interaction not found', 404);
    }

    if (interaction.status !== 'ACCEPTED') {
      throw new AppError('Chat is not authorized for this connection', 403);
    }

    const isParticipant = interaction.initiatorId._id.toString() === senderId || 
                          interaction.receiverId._id.toString() === senderId;

    if (!isParticipant) {
      throw new AppError('You are not a participant in this chat', 403);
    }

    // Save to database synchronously
    return await messageRepo.saveMessage({
      interactionId,
      senderId,
      content
    });
  }

  async getChatHistory(interactionId, userId, page = 1, limit = 50) {
    // Validate participation before returning history
    const interaction = await interactionRepo.findInteractionById(interactionId);
    if (!interaction) throw new AppError('Interaction not found', 404);

    const isParticipant = interaction.initiatorId._id.toString() === userId || 
                          interaction.receiverId._id.toString() === userId;
    
    if (!isParticipant) throw new AppError('Unauthorized', 403);

    const skip = (page - 1) * limit;
    
    // Fire and forget: mark unread messages as read
    messageRepo.markAsRead(interactionId, userId).catch(err => console.error(err));

    // Aggregate profile details for both participants
    const otherUserId = interaction.initiatorId._id.toString() === userId ? interaction.receiverId._id : interaction.initiatorId._id;
    const otherUserProfile = await FlatmateProfile.findOne({ userId: otherUserId }).select('fullName profilePicture lean');

    // Convert to plain object to attach custom properties
    const interactionObj = interaction.toObject();
    interactionObj.otherUserProfile = otherUserProfile;

    const messages = await messageRepo.getMessagesByInteraction(interactionId, limit, skip);
    return { messages, interaction: interactionObj };
  }
}