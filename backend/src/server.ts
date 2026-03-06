import express, { Express } from 'express';
import cors from 'cors';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/error.middleware';

export function createServer(): Express {
  const app = express();

  // Middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  setupRoutes(app);

  // Error handling
  app.use(errorHandler);

  return app;
}
