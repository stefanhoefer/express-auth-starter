import type { Request, Response, NextFunction } from 'express';
import { Gender } from '@prisma/client';

import { AppError } from '../error-handling/error-handling-model';
import * as limiter from './user-limiter';
import * as validator from './user-validation';
import * as userServices from './user-services';

export async function registerWithEmailAndPassword(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let email;
  let plainPassword;
  let passwordSet = false;
  try {
    email = validator.validateEmail(req.body.email);
    plainPassword = validator.validatePassword(req.body.password);
    passwordSet = true;
  } catch (error) {
    next(error);
    return;
  }

  let signupResponse;
  const hashedPassword = await userServices.passwordMethods.hashPassword(plainPassword);

  try {
    signupResponse = await userServices.createUser(email, passwordSet, hashedPassword, {});
  } catch (error) {
    next(error);
    return;
  }
  const user = signupResponse.user;
  const resendToken = await userServices.jwtMethods.createJwtToken(user.id, '15m');

  try {
    userServices.sendVerifyEmail(user.id, user.email);
  } catch (error) {
    next(error);
    return;
  }

  res.send({ resendToken: resendToken, existsAlready: signupResponse.existsAlready });
}

export async function resendVerifyEmail(req: Request, res: Response, next: NextFunction) {
  let userId;
  let user;
  let token;

  try {
    token = validator.validateJwt(req.body.resendToken);
  } catch (error) {
    next(error);
    return;
  }

  try {
    userId = await userServices.jwtMethods.verifyJwtToken(token);
  } catch (error) {
    next(error);
    return;
  }

  try {
    user = await userServices.getUserById(userId);
  } catch (error) {
    next(error);
    return;
  }

  try {
    if (user) {
      userServices.sendVerifyEmail(user.id, user.email);
    }
  } catch (error) {
    next(error);
    return;
  }
  res.send('The verification email was sent');
}

export async function verifyEmailAndSignIn(req: Request, res: Response, next: NextFunction) {
  let userId;
  let user;
  let token;

  try {
    token = validator.validateJwt(req.body.token);
  } catch (error) {
    next(error);
    return;
  }

  try {
    userId = await userServices.jwtMethods.verifyJwtToken(token);
  } catch (error) {
    next(error);
    return;
  }

  if (userId) {
    try {
      user = await userServices.confirmEmail(userId);
    } catch (error) {
      next(error);
      return;
    }
  }

  if (user) {
    let profileExistsAlready = false;
    const sessionData = await userServices.provideSessionData(user);
    req.session.data = sessionData;

    if (user.firstName || user.lastName || user.yearOfBirth || user.gender) {
      profileExistsAlready = true;
    }

    req.session.save(() => {
      res.send({ sessionData, profileExistsAlready });
    });
    return;
  } else {
    const error = new Error('sessionData could not be generated and written to the session');
    next(error);
    return;
  }
}

export async function signInWithEmailAndPassword(req: Request, res: Response, next: NextFunction) {
  let email;
  let user;
  let plainPassword;

  try {
    await limiter.rateLimit(req.ip, req.body.email);
  } catch (error) {
    next(error);
    return;
  }

  try {
    email = validator.validateEmail(req.body.email);
    plainPassword = validator.validatePassword(req.body.password);
  } catch (apiError) {
    limiter.consumePoints(req.ip, req.body.email);
    const error = new AppError(
      '/errors/user/sign-in/input-validation-failed',
      'Input validation failed',
      400,
      apiError,
    );
    next(error);
    return;
  }

  try {
    user = await userServices.getUserByEmail(email);
  } catch (serviceError) {
    limiter.consumePoints(req.ip, req.body.email);
    const error = new AppError(
      '/errors/user/sign-in/could-not-get-user',
      'Could not get user',
      400,
      serviceError,
    );
    next(error);
    return;
  }

  if (!user) {
    limiter.consumePoints(req.ip, req.body.email);
    const error = new AppError('/errors/user/sign-in/user-not-found', 'User not found', 400);
    next(error);
    return;
  }

  if (!user.emailConfirmed) {
    limiter.consumePoints(req.ip, req.body.email);
    const error = new AppError(
      '/errors/user/sign-in/email-not-confirmed',
      'Email not confirmed yet',
      406,
    );
    next(error);
    return;
  }

  if (user.passwordSet && user.password) {
    try {
      await userServices.passwordMethods.validatePassword(plainPassword, user.password);
    } catch (apiError) {
      limiter.consumePoints(req.ip, req.body.email);
      const error = new AppError(
        '/errors/user/sign-in/invalid-credentials',
        'Invalid user credentials',
        401,
        apiError,
      );
      next(error);
      return;
    }
  } else {
    limiter.consumePoints(req.ip, req.body.email);
    const error = new AppError(
      '/errors/user/sign-in/no-password-set',
      'User has not set a password',
      401,
    );
    next(error);
    return;
  }

  try {
    const sessionData = await userServices.provideSessionData(user);
    req.session.data = sessionData;
    limiter.resetLimiter(req.ip, email);
    req.session.save(() => {
      res.send({ sessionData });
    });
    return;
  } catch (apiError) {
    limiter.consumePoints(req.ip, req.body.email);
    const error = new AppError(
      '/errors/user/sign-in/providing-session-data-failed',
      'Could not provide session data',
      500,
      apiError,
    );
    next(error);
    return;
  }
}

export async function sendSignInEmail(req: Request, res: Response, next: NextFunction) {
  const email = req.body.email;
  let user;
  let firstSignIn = false;

  try {
    user = await userServices.getUserByEmail(email);
  } catch (error) {
    next(error);
    return;
  }

  if (!user) {
    const signupResponse = await userServices.createUser(email, false, undefined, {});
    user = signupResponse.user;
    firstSignIn = true;
  }

  if (user) {
    try {
      userServices.sendSignInEmail(user.id, user.email, firstSignIn);
    } catch (error) {
      next(error);
      return;
    }
  }
  return res.send({ message: 'email' });
}

export async function signInWithEmailToken(req: Request, res: Response, next: NextFunction) {
  let userId;
  let user;

  try {
    userId = await userServices.jwtMethods.verifyJwtToken(req.body.token);
  } catch (error) {
    next(error);
    return;
  }

  try {
    user = await userServices.getUserById(userId);
  } catch (error) {
    next(error);
    return;
  }

  if (!user?.emailConfirmed) {
    try {
      user = await userServices.confirmEmail(userId);
    } catch (error) {
      next(error);
      return;
    }
  }

  if (user) {
    const sessionData = await userServices.provideSessionData(user);
    req.session.data = sessionData;

    req.session.save(() => {
      res.send({ sessionData });
    });
    return;
  } else {
    const error = new Error('sessionData could not be generated for written to the session');
    next(error);
    return;
  }
}

export async function getSession(req: Request, res: Response) {
  res.cookie('XSRF-TOKEN', req.csrfToken());
  const sessionData = req.session.data;
  if (!sessionData?.userId) {
    req.session.destroy(() =>
      res.send({
        sessionData,
      }),
    );
    return;
  } else {
    res.send({ sessionData });
  }
}

export async function signOut(req: Request, res: Response) {
  req.session.destroy(() => {
    const cookieName = 't-sessionId'; // name from session config
    res.clearCookie(cookieName);
    return res.send({ message: 'logged out' });
  });
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  let user;

  const userId = req.session.data?.userId;
  const firstName: string | undefined = req.body.firstName;
  const lastName: string | undefined = req.body.lastName;
  const yearOfBirth: number | undefined = +req.body.yearOfBirth || undefined;
  const gender: Gender | undefined = req.body.gender;

  if (userId) {
    try {
      user = await userServices.updateProfile(userId, firstName, lastName, yearOfBirth, gender);
    } catch (error) {
      next(error);
      return;
    }
  }

  if (user) {
    const sessionData = await userServices.provideSessionData(user);
    req.session.data = sessionData;
    req.session.save(() => {
      res.send({ sessionData });
    });
  }
}

export async function initiatePasswordReset(req: Request, res: Response, next: NextFunction) {
  let user;

  try {
    user = await userServices.getUserByEmail(req.body.email);
  } catch (serviceError) {
    const error = new AppError(
      '/errors/user/initiatePasswordReset/database-error',
      'Could not get user by email',
      400,
      serviceError,
    );
    next(error);
    return;
  }

  if (!user) {
    const error = new AppError(
      '/errors/user/initiatePasswordReset/not-found',
      'No user with this email was found',
      404,
    );
    next(error);
    return;
  }

  try {
    userServices.sendPasswordResetEmail(user.id, user.email);
  } catch (error) {
    next(error);
    return;
  }
  return res.send({ message: 'password reset initiated' });
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  let userId;
  let user;
  const newPlainPassword = req.body.password;
  const newHashedPassword = await userServices.passwordMethods.hashPassword(newPlainPassword);

  try {
    userId = await userServices.jwtMethods.verifyJwtToken(req.body.token);
  } catch (error) {
    next(error);
    return;
  }

  try {
    user = await userServices.changePassword(userId, newHashedPassword);
  } catch (error) {
    next(error);
    return;
  }

  if (user) {
    const sessionData = await userServices.provideSessionData(user);
    req.session.data = sessionData;

    req.session.save(() => {
      res.send({ sessionData });
    });
    return;
  } else {
    const error = new Error('sessionData could not be generated for written to the session');
    next(error);
    return;
  }
}

export async function disablePasswordAuth(req: Request, res: Response, next: NextFunction) {
  let passwordSignInEnabled = true;
  if (!req.body.passwordSignInEnabled) {
    passwordSignInEnabled = false;
  }
  const userId = req.session.data?.userId;

  if (!userId) {
    const error = new AppError(
      '/errors/user/auth/unsuccessful-update',
      'Password authentication could not be disabled because no user is logged in',
      401,
    );
    next(error);
    return;
  }

  let passwordSet;
  try {
    passwordSet = await userServices.changePasswordAuthMethod(userId, passwordSignInEnabled);
  } catch (apiError) {
    const error = new AppError(
      '/errors/user/auth/update-failed',
      'The password could not be updated',
      500,
      apiError,
    );
    next(error);
    return;
  }

  res.send(passwordSet);
}

export async function enablePasswordAuth(req: Request, res: Response, next: NextFunction) {
  let user;
  let newPlainPassword = req.body.password;
  const userId = req.session.data?.userId;

  try {
    newPlainPassword = validator.validatePassword(newPlainPassword);
  } catch (error) {
    next(error);
    return;
  }

  if (!userId) {
    const error = new AppError(
      '/errors/user/auth/unsuccessful-update',
      'Password authentication could not be enabled because no user is logged in',
      401,
    );
    next(error);
    return;
  }

  const newHashedPassword = await userServices.passwordMethods.hashPassword(newPlainPassword);
  try {
    user = await userServices.changePassword(userId, newHashedPassword);
  } catch (apiError) {
    const error = new AppError(
      '/errors/user/auth/update-failed',
      'The password could not be updated',
      500,
      apiError,
    );
    next(error);
    return;
  }

  res.send({ pwSignInEnabled: user.passwordSet });
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  const userId = req.session.data?.userId;

  let user;
  let oldPlainPassword = req.body.oldPassword;
  let newPlainPassword = req.body.newPassword;

  if (!userId) {
    const error = new AppError(
      '/errors/user/auth/unsuccessful-update',
      'Password authentication could not be enabled because no user is logged in',
      401,
    );
    next(error);
    return;
  }

  try {
    oldPlainPassword = validator.validatePassword(oldPlainPassword);
    newPlainPassword = validator.validatePassword(newPlainPassword);
  } catch (error) {
    next(error);
    return;
  }
  const newHashedPassword = await userServices.passwordMethods.hashPassword(newPlainPassword);

  try {
    user = await userServices.getUserById(userId);
    if (user?.password) {
      await userServices.passwordMethods.validatePassword(oldPlainPassword, user.password);
    }
  } catch (apiError) {
    const error = new AppError(
      '/errors/user/sign-in/invalid-credentials',
      'Invalid user credentials',
      401,
      apiError,
    );
    next(error);
    return;
  }

  try {
    user = await userServices.changePassword(userId, newHashedPassword);
  } catch (error) {
    next(error);
    return;
  }

  if (user) {
    const sessionData = await userServices.provideSessionData(user);
    req.session.data = sessionData;

    req.session.save(() => {
      res.send({ sessionData });
    });
    return;
  } else {
    const error = new Error('sessionData could not be generated for written to the session');
    next(error);
    return;
  }
}

export async function sendVerifyNewEmail(req: Request, res: Response, next: NextFunction) {
  let email = req.body.newEmail;
  try {
    if (email) {
      email = validator.validateEmail(email);
    } else
      throw new AppError(
        '/errors/user/new-email/input-validation-failed/email-is-required',
        'An email address is mandatory for this request',
        400,
      );
  } catch (error) {
    next(error);
    return;
  }

  const userId = req.session.data?.userId;

  let user;
  try {
    user = await userServices.getUserByEmail(email);
  } catch (error) {
    next(error);
    return;
  }

  if (user) {
    return new AppError(
      '/errors/user/new-email/email-already-used',
      'This email address is already associated with another account',
      400,
    );
  }

  try {
    if (userId) {
      userServices.sendVerifyNewEmail(userId, email);
    }
  } catch (error) {
    next(error);
    return;
  }

  res.send('The verification email was sent');
}

export async function updateEmail(req: Request, res: Response, next: NextFunction) {
  let payload;
  let user;
  let token;

  try {
    token = validator.validateJwt(req.body.token);
  } catch (error) {
    next(error);
    return;
  }

  try {
    payload = await userServices.jwtMethods.verifyNewEmailJwtToken(token);
  } catch (error) {
    next(error);
    return;
  }

  const userId = payload.userId;
  const email = payload.newEmail;

  if (payload.userId) {
    try {
      user = await userServices.setEmail(userId, email);
    } catch (error) {
      next(error);
      return;
    }
  }

  if (user) {
    const sessionData = await userServices.provideSessionData(user);
    req.session.data = sessionData;

    req.session.save(() => {
      res.send({ sessionData });
    });
    return;
  } else {
    const error = new Error('sessionData could not be generated and written to the session');
    next(error);
    return;
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  const enteredEmail = req.body.enteredEmail;
  let email;
  let user;
  let deleted = false;

  try {
    email = validator.validateEmail(enteredEmail);
  } catch (error) {
    next(error);
    return;
  }

  if (email !== req.session.data?.email) {
    // some error (unauthorized)
  }

  try {
    user = await userServices.getUserByEmail(email);
  } catch (error) {
    // add to error
    next(error);
    return;
  }

  if (!user?.id) {
    throw new AppError('', '', 404);
  }

  try {
    deleted = await userServices.deleteUser(user.id);
  } catch (apiError) {
    const error = new AppError(
      '/errors/user/deleting-user-failed',
      'The user could not be deleted',
      500,
      apiError,
    );
    next(error);
    return;
  }
  const response = {
    email: user.email,
    deleted: deleted,
  };

  req.session.destroy(() => {
    const cookieName = 't-sessionId'; // name from session config
    res.clearCookie(cookieName);
    return res.send(response);
  });
}
