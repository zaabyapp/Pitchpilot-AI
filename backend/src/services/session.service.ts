import { v4 as uuidv4 } from 'uuid';
import { PitchSession } from '../types/session.types';

// In-memory session storage (for MVP)
const sessions = new Map<string, PitchSession>();

export class SessionService {
  static createSession(userId: string, language: 'en' | 'es'): PitchSession {
    const session: PitchSession = {
      sessionId: uuidv4(),
      userId,
      language,
      audienceType: 'investor',
      audienceDescription: '',
      status: 'onboarding',
      startTime: new Date(),
      messages: []
    };

    sessions.set(session.sessionId, session);
    return session;
  }

  static getSession(sessionId: string): PitchSession | undefined {
    return sessions.get(sessionId);
  }

  static updateSession(sessionId: string, updates: Partial<PitchSession>) {
    const session = sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
    }
  }

  static deleteSession(sessionId: string) {
    sessions.delete(sessionId);
  }

  static getAllSessions() {
    return Array.from(sessions.values());
  }
}
