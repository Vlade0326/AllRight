import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import {
  PushNotificationService,
  PushSubscriptionPayload,
} from '../../infrastructure/notifications/push-notification.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly push: PushNotificationService) {}

  @Get('vapid-public-key')
  getVapidKey() {
    return { publicKey: this.push.getPublicKey() };
  }

  @Post('subscribe')
  @UseGuards(AuthGuard)
  subscribe(
    @Req() req: { user: { sub: string } },
    @Body() body: PushSubscriptionPayload,
  ) {
    return this.push.saveSubscription(req.user.sub, body);
  }
}
