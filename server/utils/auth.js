import crypto from 'node:crypto';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { parseCookie } from 'cookie';
import env from '../config/env.js';

export const generateOTP = () => crypto.randomInt(100000, 1000000).toString();

export const hashOTP = (otp) => bcryptjs.hash(otp, 10);

export const verifyOTP = (otp, hashedOtp) => bcryptjs.compare(otp, hashedOtp);

const durationToMs = (value, fallback) => {
  const match = /^(\d+)([smhd])$/.exec(String(value || '').trim());
  if (!match) return fallback;
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * multipliers[unit];
};

const userIdOf = (user) => String(user?._id || user?.id || user);

const signToken = (user, type) => {
  const payload = {
    sub: userIdOf(user),
    ver: Number(user?.tokenVersion || 0),
    type,
  };

  if (type === 'refresh') {
    return jwt.sign(payload, env.jwtRefreshSecret, {
      algorithm: 'HS256',
      expiresIn: env.refreshTokenTtl,
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
    });
  }

  return jwt.sign(payload, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: env.accessTokenTtl,
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });
};

export const signAccessToken = (user) => signToken(user, 'access');
export const signRefreshToken = (user) => signToken(user, 'refresh');

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.jwtSecret, {
    algorithms: ['HS256'],
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
  });

export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, env.jwtRefreshSecret, {
      algorithms: ['HS256'],
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
    });
    return decoded.type === 'refresh' ? decoded : null;
  } catch {
    return null;
  }
};

const baseCookieOptions = () => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite,
  domain: env.cookieDomain,
});

const accessCookieOptions = () => ({
  ...baseCookieOptions(),
  path: '/',
  maxAge: durationToMs(env.accessTokenTtl, 15 * 60 * 1000),
});

const refreshCookieOptions = () => ({
  ...baseCookieOptions(),
  path: '/api/auth',
  maxAge: durationToMs(env.refreshTokenTtl, 7 * 24 * 60 * 60 * 1000),
});

export const setAuthCookies = (res, user) => {
  res.cookie('accessToken', signAccessToken(user), accessCookieOptions());
  res.cookie('refreshToken', signRefreshToken(user), refreshCookieOptions());
};

export const clearAuthCookies = (res) => {
  const access = accessCookieOptions();
  const refresh = refreshCookieOptions();
  delete access.maxAge;
  delete refresh.maxAge;
  res.clearCookie('accessToken', access);
  res.clearCookie('refreshToken', refresh);
};

export const getAccessTokenFromRequest = (req) => {
  const authorization = req.headers?.authorization;
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    return authorization.slice(7).trim();
  }
  return req.cookies?.accessToken || null;
};

export const getRefreshTokenFromRequest = (req) => req.cookies?.refreshToken || null;

export const getAccessTokenFromSocket = (socket) => {
  const cookieHeader = socket.handshake?.headers?.cookie;
  if (!cookieHeader) return null;
  try {
    return parseCookie(cookieHeader).accessToken || null;
  } catch {
    return null;
  }
};
