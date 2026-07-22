import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailMessage, IEmailPort } from '../../domain/ports/email.port';

@Injectable()
export class SmtpEmailAdapter implements IEmailPort {
  private readonly logger = new Logger(SmtpEmailAdapter.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    const auth = this.config.get<string>('SMTP_USER')
      ? {
          user: this.config.get<string>('SMTP_USER', ''),
          pass: this.config.get<string>('SMTP_PASS', ''),
        }
      : undefined;

    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST', ''),
      port: this.config.get<number>('SMTP_PORT', 587),
      secure: this.config.get('SMTP_SECURE', 'false') === 'true',
      auth,
    });
  }

  async send(message: EmailMessage): Promise<void> {
    const from = this.config.get<string>('SMTP_FROM', 'noreply@allright.app');
    await this.transporter.sendMail({
      from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    this.logger.log(`Email enviado a ${message.to}`);
  }
}
