import Redis from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redisConfig } from '../config/config-redis';
import { AppError } from '../error-handling/error-handling-model';
import { Request, Response, NextFunction } from 'express';

const redisClient = new Redis(redisConfig);

const rateLimiterRedis = new RateLimiterRedis({
  storeClient: redisClient,
  points: 10, // Number of points
  duration: 1, // Per second
});

export function rateLimiterMiddleware(req: Request, res: Response, next: NextFunction) {
  rateLimiterRedis
    .consume(req.ip)
    .then(() => {
      next();
    })
    .catch((rateLimiterError: Error) => {
      if(rateLimiterError.message) {
        const error = new AppError(
          '/errors/app/limiter/internal-error',
          'Rate Limiter Error',
          500,
          rateLimiterError,
        );
        next(error);
        return 
      }
      const error = new AppError(
        '/errors/app/limiter/too-many-requests',
        'Too Many requests',
        429,
        rateLimiterError,
      );
      next(error);
    });
}
