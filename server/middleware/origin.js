import env from '../config/env.js';
import { isAllowedOrigin } from '../config/cors.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const requireTrustedOrigin = (req, res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get('origin');
  if (!origin) {
    if (!env.isProduction || env.isTest) return next();
    return res.status(403).json({ success: false, message: 'Origin required' });
  }

  if (isAllowedOrigin(origin)) return next();
  return res.status(403).json({ success: false, message: 'Origin not allowed' });
};
