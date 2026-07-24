import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_SECONDS = 15 * 60;

/**
 * Account-level brute-force protection, independent of the per-IP ThrottlerGuard.
 * Tracks failed login attempts per email in Redis; after 5 failures within 15
 * minutes the account is locked out for the remainder of the window, regardless
 * of source IP (stops distributed credential-stuffing against a single account).
 */
@Injectable()
export class LoginThrottleService {
  constructor(private readonly redis: RedisService) {}

  private key(email: string): string {
    return `login_fail:${email.toLowerCase()}`;
  }

  async assertNotLocked(email: string): Promise<void> {
    const count = Number((await this.redis.get(this.key(email))) ?? 0);
    if (count >= MAX_FAILED_ATTEMPTS) {
      const ttl = await this.redis.ttl(this.key(email));
      throw new HttpException(
        {
          message: `عدد كبير جدًا من محاولات الدخول الفاشلة، حاول مرة أخرى بعد ${Math.ceil(
            ttl / 60,
          )} دقيقة`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async registerFailure(email: string): Promise<void> {
    const key = this.key(email);
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, LOCKOUT_WINDOW_SECONDS);
    }
  }

  async reset(email: string): Promise<void> {
    await this.redis.del(this.key(email));
  }
}
