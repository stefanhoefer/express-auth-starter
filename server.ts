import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import helmet from 'helmet'
import session from 'express-session';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import cors from 'cors';

import { rateLimiterMiddleware } from './config/config-rate-limiter';
import { logger, httpLogger } from './config/config-logger';
import { corsOptions, csrfOptions } from './config/config-security';
import { sessionConfig } from './config/config-session';
import * as ErrorClasses from './error-handling/error-handling-model';
import { errorHandler } from './error-handling/error-handling-middleware';
import { userRouter } from './user/user-router';

const app = express();

app.use(rateLimiterMiddleware);
app.use(helmet())

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(httpLogger);

app.use(cors(corsOptions));
app.use(csrf(csrfOptions));

const sessionSecret = process.env.SESSION_SECRET as string;
app.use(session(sessionConfig(sessionSecret)));

app.use('/', userRouter);
app.get('/favicon.ico', (req, res) => res.status(204));

app.use((req: Request, res: Response, next: NextFunction) => {
  const error = new ErrorClasses.AppError('/errors/app/not-found', 'resource was not found.', 404);
  next(error);
});

app.use(async (error: ErrorClasses.AppError, req: Request, res: Response, next:NextFunction) => {
  errorHandler.handleError(error, req, res, next);
});

process.on('unhandledRejection', rejectionReason => {
  const error = new ErrorClasses.AppError(
    '/errors/app/unhandled-rejection',
    'An unhandled rejection occurred.',
    500,
    rejectionReason,
  );
  errorHandler.handleRejection(error);
});

process.on('uncaughtException', (error: Error) => {
  errorHandler.handleUncaughtException(error);
  if (!errorHandler.isTrustedError(error)) {
    process.exit(1);
  }
});

// set port, listen for requests
const PORT = process.env.PORT;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}.`);
});
