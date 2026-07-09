import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import * as webpush from 'web-push';
import { ICachePort } from '../../domain/ports/cache.port';
import { CACHE_PORT } from '../../application/tokens';

const SUBSCRIPTION_PREFIX = 'push:sub:';

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

@Injectable()
export class PushNotificationService implements OnModuleInit {
  private readonly logger = new Logger(PushNotificationService.name);
  private enabled = false;

  constructor(
    private readonly config: ConfigService,
    @Inject(CACHE_PORT) private readonly cache: ICachePort,
  ) {}

  onModuleInit() {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT', 'mailto:admin@allright.app');

    if (!publicKey || !privateKey) {
      this.logger.warn('VAPID keys no configuradas — push notifications deshabilitadas');
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.enabled = true;
  }

  getPublicKey(): string | null {
    return this.config.get<string>('VAPID_PUBLIC_KEY') ?? null;
  }

  async saveSubscription(userId: string, subscription: PushSubscriptionPayload) {
    await this.cache.set(
      `${SUBSCRIPTION_PREFIX}${userId}`,
      JSON.stringify(subscription),
      60 * 60 * 24 * 30,
    );
  }

  async notifyUser(userId: string, title: string, body: string) {
    if (!this.enabled) return;

    const raw = await this.cache.get(`${SUBSCRIPTION_PREFIX}${userId}`);
    if (!raw) return;

    try {
      const subscription = JSON.parse(raw) as PushSubscriptionPayload;
      await webpush.sendNotification(subscription, JSON.stringify({ title, body }));
    } catch (error) {
      this.logger.warn(`Push fallido para ${userId}: ${(error as Error).message}`);
    }
  }
}
