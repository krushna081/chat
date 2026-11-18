import http from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import env from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { socketCorsOptions } from './config/cors.js';
import setupSocketHandlers from './sockets/index.js';

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: socketCorsOptions,
  maxHttpBufferSize: 1_000_000,
  pingInterval: 25_000,
  pingTimeout: 20_000,
});

app.set('io', io);
setupSocketHandlers(io);

let shuttingDown = false;

const start = async () => {
  await connectDatabase();
  server.listen(env.port, '0.0.0.0', () => {
    console.info(`RelayChat listening on port ${env.port}`);
  });
};

const shutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(`Received ${signal}; shutting down`);

  await new Promise((resolve) => {
    server.close(() => resolve());
    setTimeout(resolve, 10_000).unref();
  });

  io.close();
  await disconnectDatabase().catch(() => {});
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start().catch((error) => {
  console.error(`Failed to start RelayChat: ${error.message}`);
  process.exit(1);
});

export { app, server, io };
