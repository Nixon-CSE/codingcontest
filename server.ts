import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes';
import { Judge0Client } from './server/judge0';

console.log('Starting production server...');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Global Middlewares
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Immediate, lightweight, unauthenticated health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'CodeContest-Platform',
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV || 'development',
    });
  });

  // REST API Routes
  app.use('/api', apiRouter);

  // Background non-blocking ping to Judge0 (does not block server startup)
  try {
    const judge0 = new Judge0Client();
    judge0.ping()
      .then((res) => {
        console.log(`[Server] Judge0 ping result: ${res.ok ? 'ONLINE' : 'DEGRADED'} (${res.latencyMs}ms)`);
      })
      .catch((err) => {
        console.warn(`[Server] Judge0 ping error (non-fatal): ${err.message}`);
      });
  } catch (err: any) {
    console.warn(`[Server] Judge0 client initialization warning: ${err.message}`);
  }

  // Vite middleware for development vs Static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on 0.0.0.0:${PORT}`);
  });
}

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

