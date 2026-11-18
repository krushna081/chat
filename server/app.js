import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import env from './config/env.js';
import { corsOptions } from './config/cors.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { requireTrustedOrigin } from './middleware/origin.js';
import { apiLimiter } from './middleware/rateLimit.js';
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import userRoutes from './routes/user.js';

const app = express();
app.disable('x-powered-by');

const clientOrigin = new URL(env.clientUrl);
const socketOrigin = `${clientOrigin.protocol === 'https:' ? 'wss:' : 'ws:'}//${clientOrigin.host}`;

if (env.trustProxy !== false) {
  app.set('trust proxy', env.trustProxy);
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", socketOrigin],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: env.isProduction ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'no-referrer' },
  })
);

app.use(cors(corsOptions));
app.use(requireTrustedOrigin);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '64kb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'relaychat',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/chat', authenticate, chatRoutes);
app.use('/api/user', authenticate, userRoutes);
app.use('/api', notFound);

const indexPath = path.join(env.clientDist, 'index.html');
const hasClientBuild = env.serveClient && fs.existsSync(indexPath);

if (hasClientBuild) {
  app.use(
    express.static(env.clientDist, {
      index: false,
      maxAge: env.isProduction ? '1y' : 0,
      immutable: env.isProduction,
      setHeaders(res, filePath) {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    })
  );

  app.get(/^(?!\/api(?:\/|$)|\/socket\.io(?:\/|$)).*/, (req, res, next) => {
    if (req.method !== 'GET') return next();
    if (path.extname(req.path)) return next();
    res.setHeader('Cache-Control', 'no-cache');
    return res.sendFile(indexPath, (error) => {
      if (error) next(error);
    });
  });
}

app.use(notFound);
app.use(errorHandler);

export { app, hasClientBuild };
export default app;
