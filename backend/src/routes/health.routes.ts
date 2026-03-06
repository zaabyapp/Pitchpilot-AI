import { Router, Request, Response } from 'express';

export const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'PitchPilot AI Backend',
    environment: process.env.NODE_ENV || 'development'
  });
});
