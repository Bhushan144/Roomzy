import { AppError } from '../../../shared/errors/AppError.js';
import { InteractionRepository } from '../infrastructure/repositories/InteractionRepository.js';
import { InventoryRepository } from '../../inventory/infrastructure/repositories/InventoryRepository.js';
import { IdentityRepository } from '../../identity/infrastructure/repositories/IdentityRepository.js';
import { publishToNotificationQueue } from '../../../shared/infrastructure/queue/publisher.js';

const interactionRepo = new InteractionRepository();
const inventoryRepo = new InventoryRepository();
const identityRepo = new IdentityRepository();

export class InteractionService {
  
  async sendRequest(initiatorId, targetId, type, message) {
    // 1. Prevent duplicate requests
    const existing = await interactionRepo.checkExistingInteraction(initiatorId, targetId);
    if (existing) {
      throw new AppError('You have already sent a request to this target.', 400);
    }

    let receiverId;

    // 2. Validate Target & Determine Receiver
    if (type === 'ROOM') {
      const listing = await inventoryRepo.findListingById(targetId);
      if (!listing || listing.status !== 'PUBLISHED') {
        throw new AppError('Listing is not available.', 404);
      }
      if (listing.ownerId.toString() === initiatorId) {
        throw new AppError('You cannot send a request to your own listing.', 400);
      }
      receiverId = listing.ownerId;
    } 
    else if (type === 'FLATMATE') {
      const targetProfile = await identityRepo.getFlatmateProfile(targetId);
      if (!targetProfile) {
        throw new AppError('Target user does not have a flatmate profile.', 404);
      }
      if (targetId === initiatorId) {
        throw new AppError('You cannot send a request to yourself.', 400);
      }
      receiverId = targetId; // For flatmates, targetId is the User ID
    }

    // 3. Save to Database Synchronously
    const interaction = await interactionRepo.createInteraction({
      initiatorId,
      targetId,
      receiverId,
      type,
      message
    });

    // 4. Trigger Async Email Notification via RabbitMQ
    publishToNotificationQueue({
      type: type === 'ROOM' ? 'NEW_ROOM_INTEREST' : 'NEW_FLATMATE_CONNECTION',
      interactionId: interaction._id,
      initiatorId,
      receiverId,
      targetId
    });

    return interaction;
  }

  async respondToRequest(interactionId, receiverId, status) {
    const interaction = await interactionRepo.findInteractionById(interactionId);
    
    if (!interaction) {
      throw new AppError('Request not found.', 404);
    }

    // Security: Only the intended receiver can accept or decline
    if (interaction.receiverId.toString() !== receiverId) {
      throw new AppError('You are not authorized to respond to this request.', 403);
    }

    // State Machine Rule: Can only respond to PENDING requests
    if (interaction.status !== 'PENDING') {
      throw new AppError(`This request has already been ${interaction.status.toLowerCase()}.`, 400);
    }

    const updatedInteraction = await interactionRepo.updateStatus(interactionId, status);

    // If accepted, notify the original sender that they can now chat
    if (status === 'ACCEPTED') {
      publishToNotificationQueue({
        type: 'MATCH_ACCEPTED',
        interactionId: interaction._id,
        receiverId: interaction.initiatorId, // The original sender is now receiving the alert
        targetId: receiverId
      });
    }

    return updatedInteraction;
  }

  async getInbox(userId, type) {
    // type can be 'incoming' or 'outgoing'
    if (type === 'incoming') {
      return await interactionRepo.getIncomingRequests(userId);
    } else {
      return await interactionRepo.getOutgoingRequests(userId);
    }
  }
}