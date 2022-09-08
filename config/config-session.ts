import session from 'express-session';
import connectRedis from 'connect-redis';
import Redis from 'ioredis';

import { redisConfig } from '../config/config-redis';

const RedisStore = connectRedis(session);

const redisClient = new Redis(redisConfig);

export const sessionConfig = (sessionSecret: string) => {
  const config = {
    store: new RedisStore({ client: redisClient }),
    saveUninitialized: false,
    secret: sessionSecret,
    resave: false,
    name: 't-sessionId', // referenced in sign-out/logout function
    cookie: {
      // secure: true,
      httpOnly: true,
      // domain: 'http://localhost:3000',
      maxAge: 1*24*60*60*1000, // a day
      rolling: true,
    },
  };
  return config;
};
