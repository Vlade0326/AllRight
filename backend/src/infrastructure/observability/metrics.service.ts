import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Gauge,
  Histogram,
  Registry,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  readonly registry = new Registry();

  private readonly httpDuration: Histogram<string>;
  private readonly zkpGenerationDuration: Histogram<string>;
  private readonly zkpVerificationDuration: Histogram<string>;
  private readonly locationUpdates: Counter<string>;
  private readonly concurrentUsers: Gauge<string>;

  constructor() {
    this.httpDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [this.registry],
    });

    this.zkpGenerationDuration = new Histogram({
      name: 'zkp_proof_generation_duration_seconds',
      help: 'ZKP proof generation duration in seconds',
      labelNames: ['circuit'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.zkpVerificationDuration = new Histogram({
      name: 'zkp_proof_verification_duration_seconds',
      help: 'ZKP proof verification duration in seconds',
      labelNames: ['circuit', 'result'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
      registers: [this.registry],
    });

    this.locationUpdates = new Counter({
      name: 'location_updates_total',
      help: 'Total location update events',
      labelNames: ['result', 'zone_id'],
      registers: [this.registry],
    });

    this.concurrentUsers = new Gauge({
      name: 'concurrent_users',
      help: 'Number of concurrent active users',
      registers: [this.registry],
    });
  }

  onModuleInit() {
    collectDefaultMetrics({ register: this.registry });
  }

  observeHttpRequest(method: string, route: string, status: number, durationSec: number) {
    this.httpDuration.labels(method, route, String(status)).observe(durationSec);
  }

  startZkpGenerationTimer() {
    return this.zkpGenerationDuration.startTimer({ circuit: 'geofence_v1' });
  }

  startZkpVerificationTimer() {
    const end = this.zkpVerificationDuration.startTimer({
      circuit: 'geofence_v1',
    });
    return (result: 'valid' | 'invalid') => end({ result });
  }

  recordLocationUpdate(result: string, zoneId: string) {
    this.locationUpdates.inc({ result, zone_id: zoneId });
  }

  setConcurrentUsers(count: number) {
    this.concurrentUsers.set(count);
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
