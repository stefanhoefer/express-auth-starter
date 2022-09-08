export const corsOptions = {
  origin: [
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    'http://127.0.0.1:4173',
    'http://localhost:4173',
  ],
  allowedHeaders: [
    'X-Access-Token',
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'XSRF-Token',
  ],
  credentials: true,
};

export const csrfOptions = { cookie: { httpOnly: true, secure: false } };
