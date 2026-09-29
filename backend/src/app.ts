import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './routes';

export const createApp = () => {
  const app = express();

  // Basic CORS configuration
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-llm-provider', 'x-prompt-version'],
  }));

  // Body parser with size limits
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Basic Request Logging & Timing
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    res.setHeader('X-Request-Id', requestId);

    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.path !== '/api/health') {
        console.log(`[HTTP] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms) [${requestId}]`);
      }
    });

    next();
  });

  // Mount API Routes
  app.use('/api', routes);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
  });

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[UNHANDLED_ERROR]', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
};
