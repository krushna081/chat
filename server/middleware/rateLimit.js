import rateLimit from 'express-rate-limit';
import env from '../config/env.js';

const handler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please wait and try again.',
  });
};

const baseOptions = {
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
  skip: () => env.isTest,
};

export const apiLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 300,
});

export const authLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 40,
});

export const loginLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 12,
});

export const otpLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 12,
});

export const resendLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 4,
});

export const joinLimiter = rateLimit({
  ...baseOptions,
  windowMs: 15 * 60 * 1000,
  limit: 30,
});
