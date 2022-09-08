import { isEqual } from 'lodash';
import { PrismaClient, Gender, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { transporter } from '../config/config-nodemailer-transporter';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

const prisma = new PrismaClient();

export const passwordMethods = {
  hashPassword: async (password: string) => {
    const saltRounds = 10;
    const hash = bcrypt.hashSync(password, saltRounds);
    return hash;
  },
  validatePassword: async (enteredPassword: string, hashedPassword: string) => {
    const passwordIsValid = bcrypt.compareSync(enteredPassword, hashedPassword);
    if (!passwordIsValid) {
      throw new Error('invalid password');
    } else {
      return true;
    }
  },
};

export const jwtMethods = {
  createJwtToken: async (userId: string, expiresIn: string) => {
    const JWT_SECRET = process.env.JWT_SECRET as string;
    const token = jwt.sign({ userId: userId }, JWT_SECRET, { expiresIn: expiresIn });
    return token;
  },
  verifyJwtToken: async (token: string) => {
    const JWT_SECRET = process.env.JWT_SECRET as string;

    interface JwtPayload {
      userId: string;
      signingUp: boolean;
    }

    let userId = '';

    try {
      const { userId: id } = jwt.verify(token, JWT_SECRET) as JwtPayload;
      userId = id;
    } catch (error) {
      throw new Error('Jwt could not be verified');
    }
    return userId;
  },
  createNewEmailJwtToken: async (userId: string, newEmail: string, expiresIn: string) => {
    const JWT_SECRET = process.env.JWT_SECRET as string;
    const token = jwt.sign({ userId: userId, newEmail: newEmail }, JWT_SECRET, {
      expiresIn: expiresIn,
    });
    return token;
  },
  verifyNewEmailJwtToken: async (token: string) => {
    const JWT_SECRET = process.env.JWT_SECRET as string;

    interface JwtPayload {
      userId: string;
      newEmail: string;
    }

    let payload: JwtPayload;

    try {
      payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw new Error('Jwt could not be verified');
    }
    return payload;
  },
};

export async function createUser(
  email: string,
  passwordSet: boolean,
  password: string | undefined,
  settings: object,
) {
  let user;
  try {
    // Save User to Database
    user = await prisma.user.create({
      data: {
        email: email,
        passwordSet: passwordSet,
        password: password,
        settings: settings,
      },
    });
  } catch (error) {
    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      isEqual(error.meta, { target: ['email'] })
    ) {
      user = await getUserByEmail(email);
      if (user?.emailConfirmed === false) {
        const signupResponse = {
          user: user,
          existsAlready: true,
        };
        return signupResponse;
      }
    }
    throw error;
  }
  const signupResponse = {
    user: user,
    existsAlready: false,
  };
  return signupResponse;
}

export async function getUserByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });
  return user;
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  return user;
}

export async function sendVerifyEmail(userId: string, userEmail: string) {
  const emailToken = await jwtMethods.createJwtToken(userId, '15m');
  const url = `http://localhost:3000/confirm?token=${emailToken}`;
  transporter.sendMail({
    to: userEmail,
    subject: 'Confirm your email!',
    html: `
    Please click this <a href="${url}">link</a> to confirm your email.`,
  });
}
export async function sendVerifyNewEmail(userId: string, userEmail: string) {
  const emailToken = await jwtMethods.createNewEmailJwtToken(userId, userEmail, '15m');
  const url = `http://localhost:3000/confirm-new-email?token=${emailToken}`;
  transporter.sendMail({
    to: userEmail,
    subject: 'Confirm your email!',
    html: `
    Please click this <a href="${url}">link</a> to confirm your email.`,
  });
}

export async function confirmEmail(userId: string) {
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      emailConfirmed: true,
    },
  });

  return user;
}
export async function setEmail(userId: string, email: string) {
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      email: email,
    },
  });

  return user;
}

export async function provideSessionData(user: User) {
  const sessionData = {
    userId: user.id,
    email: user.email,
    pwSignInEnabled: user.passwordSet,
    firstName: user.firstName,
    lastName: user.lastName,
    yearOfBirth: user.yearOfBirth,
    gender: user.gender,
  };
  return sessionData;
}

export async function sendPasswordResetEmail(userId: string, userEmail: string) {
  const resetToken = await jwtMethods.createJwtToken(userId, '15m');
  const url = `http://localhost:3000/reset-password?token=${resetToken}`;
  transporter.sendMail({
    to: userEmail,
    subject: 'Reset your password!',
    html: `
    Please click this <a href="${url}">link</a> to reset your password.`,
  });
}

export async function changePassword(userId: string, newHashedPassword: string) {
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      passwordSet: true,
      password: newHashedPassword,
    },
  });

  return user;
}

export async function changePasswordAuthMethod(userId: string, newPasswordSetValue: boolean) {
  const passwordSet = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      passwordSet: newPasswordSetValue,
    },
    select: {
      passwordSet: true,
    },
  });

  return passwordSet;
}

export async function sendSignInEmail(userId: string, userEmail: string, firstSignIn: boolean) {
  let url;
  const emailToken = await jwtMethods.createJwtToken(userId, '15m');

  if (firstSignIn) {
    url = `http://localhost:3000/confirm?token=${emailToken}`;
  } else {
    url = `http://localhost:3000/email-sign-in?token=${emailToken}`;
  }
  transporter.sendMail({
    to: userEmail,
    subject: 'Your sign in Link!',
    html: `
    Please click this <a href="${url}">link</a> to sign in.`,
  });
}

export async function updateProfile(
  userId: string,
  firstName: string | undefined,
  lastName: string | undefined,
  yearOfBirth: number | undefined,
  gender: Gender | undefined,
) {
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      firstName: firstName,
      lastName: lastName,
      yearOfBirth: yearOfBirth,
      gender: gender,
    },
  });

  return user;
}

export async function deleteUser(userId: string) {
  let returnValue = false;
  const user = await prisma.user.delete({
    where: {
      id: userId,
    },
  });

  if (user) {
    returnValue = true;
  }

  return returnValue;
}
