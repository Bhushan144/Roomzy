import { Message } from '../models/Message.js';

export class MessageRepository {
  async saveMessage(data) {
    const message = new Message(data);
    return await message.save();
  }

  async getMessagesByInteraction(interactionId, limit = 50, skip = 0) {
    return await Message.find({ interactionId })
      .sort({ createdAt: -1 }) // Newest first for pagination
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async markAsRead(interactionId, targetUserId) {
    // Mark all messages in this interaction NOT sent by the current user as read
    return await Message.updateMany(
      { interactionId, senderId: { $ne: targetUserId }, isRead: false },
      { $set: { isRead: true } }
    );
  }
}