export interface PitchSession {
  sessionId: string;
  userId: string;
  language: 'en' | 'es';
  audienceType: string;
  audienceDescription: string;
  status: 'onboarding' | 'simulation' | 'feedback' | 'completed';
  startTime: Date;
  endTime?: Date;
  messages: ChatMessage[];
  videoFrames?: string[];
}

export interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface FeedbackReport {
  sessionId: string;
  narrativeFeedback: {
    strengths: string[];
    areasForImprovement: string[];
    clarity: number;
    structure: number;
  };
  bodyLanguageFeedback: {
    eyeContact: string;
    confidence: string;
    naturalness: string;
    pausesAndPacing: string;
  };
  overallScore: number;
  recommendations: string[];
  summary: string;
}
