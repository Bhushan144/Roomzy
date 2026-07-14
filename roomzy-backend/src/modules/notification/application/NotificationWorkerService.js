import { IdentityRepository } from '../../identity/infrastructure/repositories/IdentityRepository.js';
import { InventoryRepository } from '../../inventory/infrastructure/repositories/InventoryRepository.js';
import { EmailProvider } from '../../../shared/providers/EmailProvider.js';
import { templates } from '../../../shared/utils/emailTemplates.js';
import { logger } from '../../../shared/utils/logger.js';

const identityRepo = new IdentityRepository();
const inventoryRepo = new InventoryRepository();
const emailProvider = new EmailProvider();

export class NotificationWorkerService {
  
  async processNotification(payload) {
    const { type, initiatorId, receiverId, targetId } = payload;

    // 1. Fetch recipient and initiator data
    const receiver = await identityRepo.findUserById(receiverId);
    const initiator = await identityRepo.findUserById(initiatorId);

    if (!receiver || !initiator) {
      logger.error('Missing user data for notification. Dropping message.');
      return; // Do not throw, otherwise it loops in queue forever. Just drop it.
    }

    let subject = '';
    let html = '';

    // 2. Route the notification logic based on type
    switch (type) {
      case 'SEND_OTP': {
        const { email, otp } = payload;
        const otpSubject = 'Roomzy: Your Verification Code';
        const otpHtml = `<h2>Your OTP is: <strong>${otp}</strong></h2><p>This code expires in 10 minutes.</p>`;
        await emailProvider.sendEmail({ to: email, subject: otpSubject, html: otpHtml });
        logger.info(`Successfully sent OTP email to ${email}`);
        return;
      }

      case 'NEW_ROOM_INTEREST': {
        const listing = await inventoryRepo.findListingById(targetId);
        const listingName = listing ? listing.title : 'your listing';
        
        subject = 'Roomzy: New Interest in your Listing';
        html = templates.newRoomInterest(initiator.email, listingName);
        break;
      }
      
      case 'NEW_FLATMATE_CONNECTION': {
        subject = 'Roomzy: New Flatmate Request';
        html = templates.newFlatmateConnection(initiator.email);
        break;
      }

      case 'MATCH_ACCEPTED': {
        // In this case, the receiver of the email is the original initiator
        subject = 'Roomzy: Your Request was Accepted!';
        html = templates.matchAccepted(receiver.email);
        break;
      }

      default:
        logger.warn(`Unknown notification type: ${type}`);
        return;
    }

    // 3. Send the email
    await emailProvider.sendEmail({
      to: receiver.email,
      subject,
      html
    });

    logger.info(`Successfully sent ${type} email to ${receiver.email}`);
  }
}