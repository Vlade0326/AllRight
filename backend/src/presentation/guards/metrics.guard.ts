import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class MetricsGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const token = this.config.get<string>('METRICS_TOKEN');
    if (!token) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    if (this.config.get('METRICS_ALLOW_PRIVATE') === 'true' && this.isPrivateNetwork(request)) {
      return true;
    }

    const header = request.headers['x-metrics-token'];
    const bearer = request.headers.authorization?.split(' ')[1];

    if (header === token || bearer === token) {
      return true;
    }

    throw new UnauthorizedException('Token de métricas inválido');
  }

  private isPrivateNetwork(request: Request): boolean {
    const ip = request.socket.remoteAddress ?? '';
    return (
      ip.startsWith('10.') ||
      ip.startsWith('172.') ||
      ip.startsWith('192.168.') ||
      ip === '::1' ||
      ip === '127.0.0.1'
    );
  }
}
