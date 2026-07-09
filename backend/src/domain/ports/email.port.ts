export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface IEmailPort {
  send(message: EmailMessage): Promise<void>;
}
