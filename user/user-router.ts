import express, { NextFunction, Request, Response } from 'express';
import * as userController from './user-controller';

export const userRouter = express.Router();

userRouter.post('/api/auth/signup', (req: Request, res: Response, next: NextFunction) => {
  userController.registerWithEmailAndPassword(req, res, next);
});

userRouter.post('/api/auth/resend', (req: Request, res: Response, next: NextFunction) => {
  userController.resendVerifyEmail(req, res, next);
});

userRouter.post('/api/auth/confirm', (req: Request, res: Response, next: NextFunction) => {
  userController.verifyEmailAndSignIn(req, res, next);
});

userRouter.post('/api/auth/sign-in', (req: Request, res: Response, next: NextFunction) => {
  userController.signInWithEmailAndPassword(req, res, next);
});

userRouter.post('/api/auth/get-sign-in-link', (req: Request, res: Response, next: NextFunction) => {
  userController.sendSignInEmail(req, res, next);
});

userRouter.post('/api/auth/sign-in-with-link', (req: Request, res: Response, next: NextFunction) => {
  userController.signInWithEmailToken(req, res, next);
});

userRouter.get('/api/auth/get-session', (req: Request, res: Response) => {
  userController.getSession(req, res);
});
userRouter.post('/api/auth/sign-out', (req: Request, res: Response) => {
  userController.signOut(req, res);
});

userRouter.post('/api/auth/initiate-password-reset', (req: Request, res: Response, next: NextFunction) => {
  userController.initiatePasswordReset(req, res, next);
});

userRouter.post('/api/auth/reset-password', (req: Request, res: Response, next: NextFunction) => {
  userController.resetPassword(req, res, next);
});
userRouter.post('/api/auth/disable-password-sign-in', (req: Request, res: Response, next: NextFunction) => {
  userController.disablePasswordAuth(req, res, next);
});

userRouter.post('/api/auth/enable-password-sign-in', (req: Request, res: Response, next: NextFunction) => {
  userController.enablePasswordAuth(req, res, next);
});
userRouter.post('/api/auth/change-password', (req: Request, res: Response, next: NextFunction) => {
  userController.changePassword(req, res, next);
});

userRouter.post('/api/auth/initiate-update-email', (req: Request, res: Response, next: NextFunction) => {
  userController.sendVerifyNewEmail(req, res, next);
});

userRouter.post('/api/auth/update-email', (req: Request, res: Response, next: NextFunction) => {
  userController.updateEmail(req, res, next);
});

userRouter.post('/api/auth/update-profile', (req: Request, res: Response, next: NextFunction) => {
  userController.updateProfile(req, res, next);
});

userRouter.delete('/api/auth/delete-user', (req: Request, res: Response, next: NextFunction) => {
  userController.deleteUser(req, res, next);
});
