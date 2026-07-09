import { Injectable, Logger } from '@nestjs/common';
import { EmailMessage, IEmailPort } from '../../domain/ports/email.port';

@Injectable()
export class ConsoleEmailAdapter implements IEmailPort {
  private readonly logger = new Logger(ConsoleEmailAdapter.name);

  async send(message: EmailMessage): Promise<void> {
    this.logger.log(`[EMAIL] to=${message.to} subject=${message.subject}`);
    this.logger.debug(message.text);
  }
}
