import { createHash, randomBytes } from 'node:crypto';

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function createInviteCode(): string {
  return randomBytes(5).toString('hex').toUpperCase();
}
