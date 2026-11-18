import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, '../..');

// Prefer a .env in the current working directory, then fall back to the repo root.
const envCandidates = [path.resolve(process.cwd(), '.env'), path.resolve(repoRoot, '.env')];
for (const envFile of envCandidates) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
    break;
  }
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

const testFallback = (name, value) => (isTest ? value : undefined);

const requireValue = (name, { minLength = 1, fallback } = {}) => {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`${name} is required`);
  }
  if (value.length < minLength) {
    throw new Error(`${name} must be at least ${minLength} characters`);
  }
  return value;
};

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === '') return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const parseTrustProxy = (value) => {
  if (value === undefined || value === '') return isProduction ? 1 : false;
  if (value === 'true') return true;
  if (value === 'false') return false;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : value;
};

const parseOrigins = (value) =>
  String(value || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

const clientUrl = (() => {
  const configured = process.env.CLIENT_URL?.trim().replace(/\/$/, '');
  if (configured) return configured;
  if (isTest) return 'http://localhost:5173';
  if (isProduction) {
    throw new Error('CLIENT_URL is required in production');
  }
  return 'http://localhost:5173';
})();

try {
  const parsed = new URL(clientUrl);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('unsupported protocol');
} catch {
  throw new Error('CLIENT_URL must be an absolute http(s) URL');
}

const jwtSecret = requireValue('JWT_SECRET', {
  minLength: 32,
  fallback: testFallback('JWT_SECRET', 'test-access-secret-0123456789abcdef'),
});
const jwtRefreshSecret = requireValue('JWT_REFRESH_SECRET', {
  minLength: 32,
  fallback: testFallback('JWT_REFRESH_SECRET', 'test-refresh-secret-0123456789abcdef'),
});

if (jwtSecret === jwtRefreshSecret) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
}

if (
  isProduction &&
  (jwtSecret.includes('replace-with') || jwtRefreshSecret.includes('replace-with'))
) {
  throw new Error('Replace the sample JWT secrets before running in production');
}

const cookieSecure = parseBoolean(process.env.COOKIE_SECURE, isProduction);
const cookieSameSite = (process.env.COOKIE_SAME_SITE || 'lax').toLowerCase();
if (!['lax', 'strict', 'none'].includes(cookieSameSite)) {
  throw new Error('COOKIE_SAME_SITE must be lax, strict, or none');
}
if (cookieSameSite === 'none' && !cookieSecure) {
  throw new Error('COOKIE_SECURE must be true when COOKIE_SAME_SITE is none');
}

const port = Number(process.env.PORT || 5000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid port number');
}

const maxLoginAttempts = Number(process.env.MAX_LOGIN_ATTEMPTS || 5);
if (!Number.isInteger(maxLoginAttempts) || maxLoginAttempts < 1 || maxLoginAttempts > 100) {
  throw new Error('MAX_LOGIN_ATTEMPTS must be an integer between 1 and 100');
}

const loginLockMinutes = Number(process.env.LOGIN_LOCK_MINUTES || 15);
if (!Number.isInteger(loginLockMinutes) || loginLockMinutes < 1 || loginLockMinutes > 1440) {
  throw new Error('LOGIN_LOCK_MINUTES must be an integer between 1 and 1440');
}

const durationPattern = /^[1-9]\d*[smhd]$/;
const accessTokenTtl = process.env.ACCESS_TOKEN_TTL || '15m';
if (!durationPattern.test(accessTokenTtl)) {
  throw new Error('ACCESS_TOKEN_TTL must look like 15m, 1h, or 7d');
}

const refreshTokenTtl = process.env.REFRESH_TOKEN_TTL || '7d';
if (!durationPattern.test(refreshTokenTtl)) {
  throw new Error('REFRESH_TOKEN_TTL must look like 15m, 1h, or 7d');
}

export const env = Object.freeze({
  nodeEnv,
  isProduction,
  isTest,
  port,
  mongodbUri: requireValue('MONGODB_URI', {
    fallback: testFallback('MONGODB_URI', 'mongodb://127.0.0.1:27017/relaychat-test'),
  }),
  mongodbDnsServers: parseOrigins(process.env.MONGODB_DNS_SERVERS),
  jwtSecret,
  jwtRefreshSecret,
  jwtIssuer: 'relaychat',
  jwtAudience: 'relaychat-web',
  accessTokenTtl,
  refreshTokenTtl,
  clientUrl,
  allowedOrigins: [...new Set([clientUrl, ...parseOrigins(process.env.ALLOWED_ORIGINS)])],
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  cookieSecure,
  cookieSameSite,
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'RelayChat <onboarding@resend.dev>',
  serveClient: parseBoolean(process.env.SERVE_CLIENT, true),
  clientDist: path.resolve(repoRoot, process.env.CLIENT_DIST || 'client/dist'),
  maxLoginAttempts,
  loginLockMinutes,
  maxAvatarBytes: 512 * 1024,
});

export default env;
