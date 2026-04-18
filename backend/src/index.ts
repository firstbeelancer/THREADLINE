import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { initDB } from './db';
import { authRoutes } from './routes/auth';
import { uploadRoutes } from './routes/upload';

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PORT = parseInt(process.env.PORT || '3001', 10);

async function start(): Promise<void> {
  // Register plugins
  await server.register(cors, {
    origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
      const allowed = [
        'http://localhost:5173',
        'http://localhost:3000',
        FRONTEND_URL,
      ].filter(Boolean);

      if (!origin || allowed.some(a => origin.startsWith(a))) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await server.register(cookie, {
    secret: process.env.COOKIE_SECRET || process.env.JWT_SECRET || 'cookie_secret_change_in_production',
  });

  // Health check
  server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Register auth routes
  await server.register(authRoutes);
  await server.register(uploadRoutes);

  // Initialize database
  await initDB();

  // Start server
  await server.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`Server running on port ${PORT}`);
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
