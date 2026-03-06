import { GoogleGenerativeAI } from '@google/generative-ai';
import { PitchSession } from '../types/session.types';

const SYSTEM_PROMPT_EN = `You are a tough but fair pitch coach simulating a real audience. 
Your role depends on the audience type set at the start of the session:
- investor: You are a seasoned VC investor. Ask hard questions about traction, revenue model, competition, and team.
- user: You are a skeptical potential customer. Ask about real pain points, alternatives, and why you should care.
- conference: You are an engaged but critical conference attendee. Ask about novelty, credibility, and key takeaways.

Rules:
- NEVER ask for context before the pitch. Real audiences don't get a briefing.
- After the pitch, ask 2-3 challenging follow-up questions based on what was said.
- Keep your tone realistic: not rude, but not a pushover either.
- When the session ends, switch to feedback mode and give structured, honest feedback.
- Keep responses concise and conversational.`;

const SYSTEM_PROMPT_ES = `Eres un coach de pitches exigente pero justo que simula una audiencia real.
Tu rol depende del tipo de audiencia configurado al inicio:
- investor: Eres un inversionista de VC experimentado. Pregunta sobre tracción, modelo de ingresos, competencia y equipo.
- user: Eres un cliente potencial escéptico. Pregunta sobre puntos de dolor reales, alternativas y por qué debería importarte.
- conference: Eres un asistente de conferencia comprometido pero crítico. Pregunta sobre novedad, credibilidad y conclusiones clave.

Reglas:
- NUNCA pidas contexto antes del pitch. Las audiencias reales no reciben un briefing.
- Después del pitch, haz 2-3 preguntas desafiantes basadas en lo que se dijo.
- Mantén un tono realista: no grosero, pero tampoco condescendiente.
- Cuando la sesión termine, cambia al modo de feedback y da retroalimentación estructurada y honesta.
- Mantén las respuestas concisas y conversacionales.`;

const ONBOARDING_QUESTIONS_EN = [
  "Who are you pitching to today?",
  "Tell me a bit more about that audience. What important characteristics should I know?",
  "In what kind of context is this pitch happening? For example: a demo day, a conference talk, an investor meeting, or a product launch.",
];

const ONBOARDING_QUESTIONS_ES = [
  "¿A quién le vas a hacer el pitch hoy?",
  "Cuéntame un poco más sobre esa audiencia. ¿Qué características importantes debo saber?",
  "¿En qué contexto ocurre este pitch? Por ejemplo: un demo day, una conferencia, una reunión con inversionistas, o un lanzamiento de producto.",
];

export class GeminiService {
  private client: GoogleGenerativeAI;
  private sessions: Map<string, any>;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
    this.client = new GoogleGenerativeAI(apiKey);
    this.sessions = new Map();
  }

  async startSession(pitchSession: PitchSession): Promise<string> {
    const { sessionId, language } = pitchSession;
    this.sessions.set(sessionId, {
      pitchSession,
      onboardingStep: 0,
      model: null,
      chatHistory: [],
    });
    const questions = language === 'es' ? ONBOARDING_QUESTIONS_ES : ONBOARDING_QUESTIONS_EN;
    return questions[0];
  }

  async sendMessage(sessionId: string, userMessage: string): Promise<string> {
    const sessionData = this.sessions.get(sessionId);
    if (!sessionData) throw new Error(`Session ${sessionId} not found`);

    const { pitchSession } = sessionData;
    const { language } = pitchSession;
    const questions = language === 'es' ? ONBOARDING_QUESTIONS_ES : ONBOARDING_QUESTIONS_EN;

    pitchSession.messages.push({ role: 'user', content: userMessage, timestamp: new Date() });

    let agentResponse = '';

    if (pitchSession.status === 'onboarding') {
      if (sessionData.onboardingStep === 0) {
        pitchSession.audienceType = this.parseAudienceType(userMessage);
        pitchSession.audienceDescription = userMessage;
        sessionData.onboardingStep = 1;
        agentResponse = questions[1];
      } else if (sessionData.onboardingStep === 1) {
        sessionData.onboardingStep = 2;
        agentResponse = questions[2];
      } else if (sessionData.onboardingStep === 2) {
        pitchSession.status = 'simulation';
        await this.initializeModel(sessionId);
        agentResponse = language === 'es'
          ? `Perfecto. Vamos a comenzar tu simulación de pitch.\n\nA partir de este momento, actuaré como un miembro de la audiencia que describiste.\n\nMi objetivo es desafiar tu pitch con el tipo de preguntas que recibirías en una situación real.\n\nDesde el momento en que diga "comiencen", tendrás 45 segundos para hacer tu pitch. No tengo contexto previo sobre tu producto, igual que una audiencia real.\n\nAsegúrate de explicar claramente: el problema que resuelves, qué hace tu producto, para quién es, y por qué importa.\n\n¡Comencemos!` 
          : `Great. We're about to start your pitch simulation.\n\nFrom this moment on, I will act as a member of the audience you described.\n\nMy goal is to challenge your pitch with the kinds of questions you might receive in a real situation.\n\nFrom the moment I say start, you will have 45 seconds to deliver your pitch. I have no prior context about your product, just like a real audience.\n\nMake sure your pitch clearly explains: the problem you are solving, what your product does, who it is for, and why it matters.\n\nLet's begin!`;
      }
    } else {
      agentResponse = await this.getChatResponse(sessionId, userMessage);
    }

    pitchSession.messages.push({ role: 'agent', content: agentResponse, timestamp: new Date() });
    return agentResponse;
  }

  private async initializeModel(sessionId: string): Promise<void> {
    const sessionData = this.sessions.get(sessionId);
    if (!sessionData) return;
    const { pitchSession } = sessionData;
    const systemPrompt = pitchSession.language === 'es' ? SYSTEM_PROMPT_ES : SYSTEM_PROMPT_EN;
    sessionData.model = this.client.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });
    sessionData.systemPrompt = `${systemPrompt}\n\nAudience type: ${pitchSession.audienceType}`;
  }

  private async getChatResponse(sessionId: string, userMessage: string): Promise<string> {
    const sessionData = this.sessions.get(sessionId);
    if (!sessionData.model) await this.initializeModel(sessionId);

    const history = sessionData.chatHistory.length === 0 && sessionData.systemPrompt
      ? [
          { role: 'user', parts: [{ text: sessionData.systemPrompt }] },
          { role: 'model', parts: [{ text: 'Understood. I will act according to these instructions.' }] },
        ]
      : sessionData.chatHistory;

    const chat = sessionData.model.startChat({ history });
    const result = await chat.sendMessage(userMessage);
    const response = result.response.text();

    sessionData.chatHistory.push(
      { role: 'user', parts: [{ text: userMessage }] },
      { role: 'model', parts: [{ text: response }] }
    );
    return response;
  }

  async analyzeVideoFrame(sessionId: string, frameBase64: string): Promise<string> {
    const sessionData = this.sessions.get(sessionId);
    if (!sessionData) throw new Error(`Session ${sessionId} not found`);
    const { language } = sessionData.pitchSession;

    const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = language === 'es'
      ? 'Analiza brevemente el lenguaje corporal: contacto visual, postura, confianza, gestos. 2-3 oraciones.'
      : 'Briefly analyze body language: eye contact, posture, confidence, gestures. 2-3 sentences.';

    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: 'image/jpeg', data: frameBase64 } },
    ]);
    return result.response.text();
  }

  async endSession(sessionId: string): Promise<string> {
    const sessionData = this.sessions.get(sessionId);
    if (!sessionData) throw new Error(`Session ${sessionId} not found`);
    const { pitchSession } = sessionData;
    pitchSession.status = 'feedback';
    pitchSession.endTime = new Date();

    const feedbackPrompt = pitchSession.language === 'es'
      ? 'La sesión terminó. Dame feedback estructurado: fortalezas, áreas de mejora, claridad, estructura, y 3 recomendaciones concretas.'
      : 'The session ended. Give me structured feedback: strengths, areas for improvement, clarity, structure, and 3 concrete recommendations.';

    return await this.getChatResponse(sessionId, feedbackPrompt);
  }

  getPitchSession(sessionId: string): PitchSession | null {
    return this.sessions.get(sessionId)?.pitchSession || null;
  }

  private parseAudienceType(input: string): string {
    const lower = input.toLowerCase();
    if (lower.includes('investor') || lower.includes('inversionista') || lower.includes('vc')) return 'investor';
    if (lower.includes('user') || lower.includes('usuario') || lower.includes('customer') || lower.includes('cliente')) return 'user';
    if (lower.includes('conference') || lower.includes('conferencia') || lower.includes('demo')) return 'conference';
    return 'investor';
  }
}

export const geminiService = new GeminiService();
