import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../../infrastructure/observability/metrics.service';

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<{
      method: string;
      route?: { path?: string };
      url: string;
    }>();
    const start = process.hrtime.bigint();

    return next.handle().pipe(
      tap({
        next: () => this.record(request, start, 200),
        error: (err: { status?: number }) =>
          this.record(request, start, err?.status ?? 500),
      }),
    );
  }

  private record(
    request: { method: string; route?: { path?: string }; url: string },
    start: bigint,
    status: number,
  ) {
    const durationSec = Number(process.hrtime.bigint() - start) / 1e9;
    const route = request.route?.path ?? request.url.split('?')[0];
    this.metrics.observeHttpRequest(request.method, route, status, durationSec);
  }
}
