import nodemailer from 'nodemailer';
import { config } from '../config/env.config.js';
import { logger } from '../utils/logger.js';

export class EmailProvider {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
    this.defaultFrom = `Roomzy Notifications <${config.SMTP_USER}>`;
  }

  async sendEmail({ to, subject, html }) {
    try {
      const info = await this.transporter.sendMail({
        from: this.defaultFrom,
        to,
        subject,
        html,
      });
      return info;
    } catch (error) {
      logger.error(`Failed to send email via provider: ${error.message} (code: ${error.code || 'N/A'})`);
      throw error;
    }
  }
}