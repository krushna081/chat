export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
};

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  let status = error.status || error.statusCode || 500;
  let message = error.message || 'Internal server error';

  if (error.name === 'ValidationError') {
    status = 400;
    message = Object.values(error.errors)[0]?.message || 'Invalid input';
  } else if (error.name === 'CastError') {
    status = 400;
    message = 'Invalid input';
  } else if (error.code === 11000) {
    status = 409;
    message = 'That value is already in use';
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    status = 401;
    message = 'Session expired';
  }

  if (status >= 500) {
    console.error(`[server] ${error.name}: ${error.message}`);
  }

  const safeMessage = status >= 500 ? 'Internal server error' : message;
  res.status(status).json({ success: false, message: safeMessage });
};
