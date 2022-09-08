import validator from 'validator';
import { AppError } from '../error-handling/error-handling-model';
import { Gender } from '@prisma/client';

export function validateEmail(email: string) {
  const isEmail = validator.isEmail(email);

  if (!isEmail) {
    throw new AppError('/user/validation/not-an-email', 'No valid email-address was provided', 400);
  }

  const sanitizedEmail = validator.normalizeEmail(email);

  if (!sanitizedEmail) {
    throw new AppError(
      '/user/validation/email-sanitization-error',
      'An error during email validation occurred',
      400,
    );
  }

  return sanitizedEmail;
}

export function validatePassword(plainPassword: string) {
  const isValidPassword = validator.isStrongPassword(plainPassword, {
    minLength: 8,
    minLowercase: 0,
    minUppercase: 0,
    minNumbers: 0,
    minSymbols: 0,
    returnScore: false,
    // pointsPerUnique: 1,
    // pointsPerRepeat: 0.5,
    // pointsForContainingLower: 10,
    // pointsForContainingUpper: 10,
    // pointsForContainingNumber: 10,
    // pointsForContainingSymbol: 10,
  });
  if (!isValidPassword) {
    throw new AppError(
      '/user/validation/not-a-valid-password',
      'No valid password was provided',
      400,
    );
  }

  return plainPassword;
}

export function trimName(name: string) {
  name = validator.trim(name);
  return name;
}

export function validateJwt(jwt: string) {
  const isJwt = validator.isJWT(jwt);

  if (!isJwt) {
    throw new AppError('/user/validation/not-a-jwt', 'No valid JWT was provided', 400);
  }
  return jwt;
}

export function validateYearOfBirth(year: string) {
  const lastValidYear = new Date().getFullYear();
  const firstValidYear = new Date().getFullYear() - 125;

  const isValidYearOfBirth = validator.isInt(year, {
    min: firstValidYear,
    max: lastValidYear,
    allow_leading_zeroes: false,
  });

  if (!isValidYearOfBirth) {
    throw new AppError(
      '/user/validation/not-a-valid-birth-year',
      'No valid year of birth was provided',
      400,
    );
  }
  return year;
}

export function validateGender(gender: string) {
  const existsInEnum = Object.values(Gender).includes(gender as Gender);
  if (!existsInEnum) {
    throw new AppError('/user/validation/gender-not-valid', 'No valid gender was provided', 400);
  }
  return gender;
}
