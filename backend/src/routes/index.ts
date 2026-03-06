import { Express } from 'express';
import * as healthRoutes from './health.routes';
import * as pitchRoutes from './pitch.routes';

export function setupRoutes(app: Express) {
  app.use('/api/health', healthRoutes.router);
  app.use('/api/pitch', pitchRoutes.router);
}
