import { Router, Request, Response } from 'express';
import { SessionService } from '../services/session.service';
import { geminiService } from '../services/gemini.service';

export const router = Router();

// Initialize new pitch session
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { userId, language } = req.body;

    if (!userId || !language) {
      return res.status(400).json({ error: 'userId and language are required' });
    }

    const session = SessionService.createSession(userId, language);
    const firstMessage = await geminiService.startSession(session);

    res.json({
      success: true,
      sessionId: session.sessionId,
      message: firstMessage,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initialize session' });
  }
});

// Send message to agent
router.post('/message', async (req: Request, res: Response) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    const response = await geminiService.sendMessage(sessionId, message);

    res.json({
      success: true,
      sessionId,
      message: response,
    });
  } catch (error) {
    console.error('Message error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Analyze video frame
router.post('/video-frame', async (req: Request, res: Response) => {
  try {
    const { sessionId, frameBase64 } = req.body;

    if (!sessionId || !frameBase64) {
      return res.status(400).json({ error: 'sessionId and frameBase64 are required' });
    }

    const analysis = await geminiService.analyzeVideoFrame(sessionId, frameBase64);

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze video frame' });
  }
});

// End session and get feedback
router.post('/end', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const feedback = await geminiService.endSession(sessionId);

    res.json({
      success: true,
      sessionId,
      feedback,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// Get session details
router.get('/session/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = geminiService.getPitchSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve session' });
  }
});
