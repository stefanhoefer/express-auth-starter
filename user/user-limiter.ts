import Redis from 'ioredis';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import { redisConfig } from '../config/config-redis';
import { AppError } from '../error-handling/error-handling-model';

const redisClient = new Redis(redisConfig);

const maxWrongAttemptsByIPperDay = 100;
const maxConsecutiveFailsByUsernameAndIP = 10;

const limiterSlowBruteByIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'login_fail_ip_per_day',
  points: maxWrongAttemptsByIPperDay,
  duration: 60 * 60 * 24,
  blockDuration: 60 * 60 * 24, // Block for 1 day, if 100 wrong attempts per day
});

const limiterConsecutiveFailsByUsernameAndIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'login_fail_consecutive_username_and_ip',
  points: maxConsecutiveFailsByUsernameAndIP,
  duration: 60 * 60 * 24 * 90, // Store number for 90 days since first fail
  blockDuration: 60 * 60, // Block for 1 hour
});

const getUsernameIPkey = (email: string, ip: string) => `${email}_${ip}`;

// login controller: try rateLimit first
export async function rateLimit(reqIP: string, email: string) {
  const usernameIPkey = getUsernameIPkey(email, reqIP);

  const [resUsernameAndIP, resSlowByIP] = await Promise.all([
    limiterConsecutiveFailsByUsernameAndIP.get(usernameIPkey),
    limiterSlowBruteByIP.get(reqIP),
  ]);

  let retrySecs = 0;

  // Check if IP or Username + IP is already blocked
  if (resSlowByIP !== null && resSlowByIP.consumedPoints > maxWrongAttemptsByIPperDay) {
    retrySecs = Math.round(resSlowByIP.msBeforeNext / 1000) || 1;
  } else if (
    resUsernameAndIP !== null &&
    resUsernameAndIP.consumedPoints > maxConsecutiveFailsByUsernameAndIP
  ) {
    retrySecs = Math.round(resUsernameAndIP.msBeforeNext / 1000) || 1;
  }

  if (retrySecs > 0) {
    throw new AppError(
      '/errors/user/limiter/too-many-requests',
      'Too Many failed authentication attempts',
      429,
      { retryAfter: String(retrySecs) },
    );
  }
}

// consumeLimiterPoints if login failed

export async function consumePoints(reqIP: string, email?: string) {
  try {
    const promises = [limiterSlowBruteByIP.consume(reqIP)];
    if (email) {
      const usernameIPkey = getUsernameIPkey(email, reqIP);
      // Count failed attempts by Username + IP only for registered users
      promises.push(limiterConsecutiveFailsByUsernameAndIP.consume(usernameIPkey));
    }

    await Promise.all(promises);
  } catch (rlRejected) {
    if (rlRejected instanceof RateLimiterRes) {
      throw new AppError(
        '/errors/user/limiter/too-many-requests',
        'Too Many failed authentication attempts',
        429,
        { retryAfter: String(Math.round(rlRejected.msBeforeNext / 1000)) || 1 },
      );
    } else {
      throw new AppError(
        '/errors/user/limiter/internal-error',
        'An internal rate limiter error occurred',
        500,
        rlRejected,
      );
    }
  }
}

export async function resetLimiter(reqIP: string, email: string) {
  const usernameIPkey = getUsernameIPkey(email, reqIP);
  const [resUsernameAndIP] = await Promise.all([
    limiterConsecutiveFailsByUsernameAndIP.get(usernameIPkey),
    limiterSlowBruteByIP.get(reqIP),
  ]);
  if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > 0) {
    // Reset on successful authorization
    await limiterConsecutiveFailsByUsernameAndIP.delete(usernameIPkey);
  }
}
