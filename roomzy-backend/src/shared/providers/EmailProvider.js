import { Resend } from 'resend';
import { config } from '../config/env.config.js';
import { logger } from '../utils/logger.js';

export class EmailProvider {
  constructor() {
    this.resend = new Resend(config.RESEND_API_KEY);
    this.defaultFrom = config.RESEND_FROM_EMAIL || 'Roomzy <onboarding@resend.dev>';
  }

  async sendEmail({ to, subject, html }) {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.defaultFrom,
        to: [to],
        subject,
        html,
      });

      if (error) {
        logger.error(`Resend API error: ${error.message} (name: ${error.name})`);
        throw new Error(error.message);
      }

      logger.info(`Email sent successfully via Resend (id: ${data.id})`);
      return data;
    } catch (error) {
      logger.error(`Failed to send email via provider: ${error.message}`);
      throw error;
    }
  }
}