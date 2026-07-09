import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMAIL_PORT } from '../../application/tokens';
import { ConsoleEmailAdapter } from './console-email.adapter';
import { SmtpEmailAdapter } from './smtp-email.adapter';

export const emailProvider: Provider = {
  provide: EMAIL_PORT,
  inject: [ConfigService, ConsoleEmailAdapter, SmtpEmailAdapter],
  useFactory: (
    config: ConfigService,
    console: ConsoleEmailAdapter,
    smtp: SmtpEmailAdapter,
  ) => (config.get('SMTP_HOST') ? smtp : console),
};
