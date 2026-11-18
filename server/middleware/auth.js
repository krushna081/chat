import User from '../models/User.js';
import { AppError, asyncHandler } from './errors.js';
import { getAccessTokenFromRequest, verifyAccessToken } from '../utils/auth.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const token = getAccessTokenFromRequest(req);
  if (!token) {
    throw new AppError(401, 'Authentication required');
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw new AppError(401, 'Session expired');
  }

  if (decoded.type !== 'access') {
    throw new AppError(401, 'Session expired');
  }

  const user = await User.findById(decoded.sub).select('tokenVersion isEmailVerified');
  const tokenVersion = Number(user?.tokenVersion || 0);
  if (!user || !user.isEmailVerified || tokenVersion !== Number(decoded.ver)) {
    throw new AppError(401, 'Session expired');
  }

  req.userId = String(user._id);
  req.tokenVersion = tokenVersion;
  next();
});
