import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

import { logger } from '../config/config-logger';
import { AppError, createFallbackResponse, ErrorClientResponse } from './error-handling-model';

class ErrorHandler {
  public isTrustedError(error: Error) {
    if (error instanceof AppError) {
      return true;
    }
    return false;
  }

  public async handleUncaughtException(error: Error) {
    logger.fatal('uncaughtException');
    logger.fatal(error);
    // could be extended to sending a mail etc.
  }
  public async handleRejection(error: Error) {
    logger.error('unhandledRejection');
    logger.error(error);
    // could be extended to sending a mail etc.
  }

  public async handleError(
    error: AppError,
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    error.instance = req.baseUrl + req.path;

    // req.log.warn('request that resulted in error: ');  // DOS-attacks result in http-logging to result in unhandled promise rejection
    logger.error(error);

    if (
      error.apiError instanceof Prisma.PrismaClientRustPanicError ||
      error.apiError instanceof Prisma.PrismaClientInitializationError ||
      error.apiError instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      error.errorType = '/errors/app/database/unknown';
      error.httpStatusCode = 500;
      error.message = 'An unknown database error occurred';
    }

    const responseToClient = new ErrorClientResponse(
      error.errorType,
      error.httpStatusCode,
      error.message,
      error.instance,
    );

    if (Object.values(responseToClient).every(value => value)) {
      res.status(responseToClient.httpStatusCode).send({ error: responseToClient });
    } else {
      const response = createFallbackResponse();
      res.status(500).send({ error: response });
    }
    next();
  }
}

export const errorHandler = new ErrorHandler();
