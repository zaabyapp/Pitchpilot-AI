import { Router, Request, Response } from 'express';
import { SessionService } from '../services/session.service';

export const router = Router();

// Initialize new pitch session
router.post('/start', (req: Request, res: Response) => {
  try {
    const { userId, language } = req.body;
    
    if (!userId || !language) {
      return res.status(400).json({ error: 'userId and language are required' });
    }

    const session = SessionService.createSession(userId, language);
    res.json({
      success: true,
      sessionId: session.sessionId,
      message: 'Pitch session initialized'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialize session' });
  }
});

// Get session details
router.get('/session/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = SessionService.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      session
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});

// Generate feedback
router.post('/feedback', (req: Request, res: Response) => {
  res.json({
    message: 'Feedback generation endpoint - to be implemented',
    status: 'WIP'
  });
});

// Get report
router.get('/report/:sessionId', (req: Request, res: Response) => {
  res.json({
    message: 'Report retrieval endpoint - to be implemented',
    status: 'WIP'
  });
});
