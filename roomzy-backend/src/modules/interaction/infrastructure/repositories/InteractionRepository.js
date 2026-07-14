import { Interaction } from '../models/Interaction.js';

export class InteractionRepository {
  async createInteraction(data) {
    const interaction = new Interaction(data);
    return await interaction.save();
  }

  async findInteractionById(interactionId) {
    return await Interaction.findById(interactionId)
      .populate('initiatorId', 'email role')
      .populate('receiverId', 'email role');
  }

  async checkExistingInteraction(initiatorId, targetId) {
    return await Interaction.findOne({ 
      initiatorId, 
      targetId,
      status: { $in: ['PENDING', 'ACCEPTED'] }
    });
  }

  async findInteractionsByListings(initiatorId, listingIds) {
    return await Interaction.find({
      initiatorId,
      targetId: { $in: listingIds },
      type: 'ROOM'
    }).lean();
  }

  async updateStatus(interactionId, status) {
    return await Interaction.findByIdAndUpdate(
      interactionId,
      { status },
      { new: true, runValidators: true }
    );
  }

  async getIncomingRequests(receiverId, limit = 20, skip = 0) {
    return await Interaction.find({ receiverId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('initiatorId', 'email role -_id')
      .lean();
  }

  async getOutgoingRequests(initiatorId, limit = 20, skip = 0) {
    return await Interaction.find({ initiatorId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('receiverId', 'email role -_id')
      .lean();
  }

  async getAcceptedInteractionsForUser(userId) {
    return await Interaction.find({
      $or: [{ initiatorId: userId }, { receiverId: userId }],
      status: 'ACCEPTED'
    }).select('_id');
  }
}