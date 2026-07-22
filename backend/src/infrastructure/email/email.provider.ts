import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EMAIL_PORT } from '../../application/tokens';
import { ConsoleEmailAdapter } from './console-email.adapter';
import { SmtpEmailAdapter } from './smtp-email.adapter';

/** Solo instancia SMTP si hay SMTP_HOST; evita getOrThrow al arrancar sin correo. */
export const emailProvider: Provider = {
  provide: EMAIL_PORT,
  inject: [ConfigService],
  useFactory: (config: ConfigService) =>
    config.get<string>('SMTP_HOST')
      ? new SmtpEmailAdapter(config)
      : new ConsoleEmailAdapter(),
};
