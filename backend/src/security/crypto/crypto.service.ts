import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  private keyStore = new Map<string, string>();

  destroyKey(userId: string) {
    this.keyStore.delete(userId);
  }

  encrypt(data: string, userId: string) {
    const key = crypto.randomBytes(32).toString('hex');
    this.keyStore.set(userId, key);
    return `ENCRYPTED_DATA_WITH_KEY_${key}`;
  }
}