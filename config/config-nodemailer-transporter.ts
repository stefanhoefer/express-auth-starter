import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    port: 1025,
    secure: false,
    host: 'localhost',
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false,
    },
  });
