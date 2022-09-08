import 'express-session';

declare module 'express-session' {
  interface SessionData {
    data: {
      userId: string;
      email: string;
      pwSignInEnabled: boolean,
      firstName: string | null | undefined,
      lastName: string | null | undefined,
      yearOfBirth: number | null | undefined,
      gender: string | null | undefined,
    };
  }
}
