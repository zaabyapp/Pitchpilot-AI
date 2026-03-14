import { Express } from 'express';
import * as healthRoutes from './health.routes';

export function setupRoutes(app: Express) {
  app.use('/api/health', healthRoutes.router);
}
