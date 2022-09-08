declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      PORT: number;
      NODE_LOGGING_LEVEL: string;
      JWT_SECRET: string;
      SESSION_SECRET: string;
      DATABASE_URL: string;
      REDIS_HOST: string;
      REDIS_PORT: number;
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};
