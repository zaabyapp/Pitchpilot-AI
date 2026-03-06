import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';

const GEMINI_LIVE_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

const SYSTEM_PROMPT_EN = `You are a tough but fair AI pitch coach and audience simulator for PitchPilot AI.
Your job is to help founders practice their startup pitches through a real-time voice conversation.

Start the conversation by briefly welcoming the user and asking:
1. Who they are pitching to today (investor, potential customer, or conference audience)
2. A bit about that audience and what they care about
3. The context or setting of the pitch (demo day, investor meeting, conference talk, etc.)

Once you have that context, tell them you are ready and ask them to start their 45-second pitch whenever they are ready.
While they pitch, listen without interrupting.
After they finish, ask 2-3 sharp, challenging follow-up questions that a real audience member in that role would ask.

Rules:
- Keep your responses concise — this is a spoken voice conversation, not text
- Be realistic: demanding but fair, not rude or condescending
- Focus on real weaknesses: traction, business model, competition, team credibility
- If asked for overall feedback at the end, give brief structured feedback: strengths, areas to improve, top 3 recommendations`;

const SYSTEM_PROMPT_ES = `Eres un coach de pitches y simulador de audiencia de IA para PitchPilot AI.
Tu trabajo es ayudar a los fundadores a practicar sus pitches de startups a través de una conversación de voz en tiempo real.

Comienza la conversación dando la bienvenida brevemente al usuario y preguntando:
1. A quién le va a hacer el pitch hoy (inversor, cliente potencial, o audiencia de conferencia)
2. Un poco sobre esa audiencia y qué les importa
3. El contexto o entorno del pitch (demo day, reunión de inversores, conferencia, etc.)

Una vez que tengas ese contexto, dile que estás listo y pídele que comience su pitch de 45 segundos cuando esté listo.
Mientras hace el pitch, escucha sin interrumpir.
Después de que termine, haz 2-3 preguntas de seguimiento desafiantes que un miembro real de esa audiencia haría.

Reglas:
- Mantén las respuestas concisas — esta es una conversación de voz, no texto
- Sé realista: exigente pero justo, no grosero ni condescendiente
- Enfócate en debilidades reales: tracción, modelo de negocio, competencia, credibilidad del equipo
- Si te piden feedback al final, da feedback estructurado breve: fortalezas, áreas a mejorar, top 3 recomendaciones`;

interface ClientMessage {
  type: 'init' | 'audio' | 'end_session';
  language?: string;
  data?: string;
}

export function setupVoiceWebSocket(server: http.Server): void {
  const wss = new WebSocketServer({ server, path: '/ws/voice' });

  wss.on('connection', (clientWs) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      clientWs.close(1011, 'API key not configured');
      return;
    }

    let geminiWs: WebSocket | null = null;
    let isInitialized = false;

    const connectToGemini = (language: string) => {
      const systemPrompt = language === 'es' ? SYSTEM_PROMPT_ES : SYSTEM_PROMPT_EN;

      geminiWs = new WebSocket(`${GEMINI_LIVE_URL}?key=${apiKey}`);

      geminiWs.on('open', () => {
        const setupMsg = {
          setup: {
            model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
              },
            },
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
          },
        };
        geminiWs!.send(JSON.stringify(setupMsg));
      });

      geminiWs.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());

          if (msg.setupComplete !== undefined) {
            isInitialized = true;
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'ready' }));
            }
          } else if (msg.serverContent) {
            const { modelTurn, turnComplete } = msg.serverContent;
            if (modelTurn?.parts) {
              for (const part of modelTurn.parts) {
                if (part.inlineData?.data && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(
                    JSON.stringify({
                      type: 'audio',
                      data: part.inlineData.data,
                      mimeType: part.inlineData.mimeType ?? 'audio/pcm;rate=24000',
                    })
                  );
                } else if (part.text && clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: 'transcript', text: part.text, role: 'model' }));
                }
              }
            }
            if (turnComplete && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'turn_complete' }));
            }
          }
        } catch (err) {
          console.error('[VoiceWS] Error parsing Gemini message:', err);
        }
      });

      geminiWs.on('error', (err) => {
        console.error('[VoiceWS] Gemini error:', err.message);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'error', message: 'AI connection error' }));
        }
      });

      geminiWs.on('close', () => {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.close(1000, 'AI session ended');
        }
      });
    };

    clientWs.on('message', (raw) => {
      try {
        const msg: ClientMessage = JSON.parse(raw.toString());

        if (msg.type === 'init') {
          connectToGemini(msg.language ?? 'en');
        } else if (msg.type === 'audio' && isInitialized && geminiWs?.readyState === WebSocket.OPEN) {
          geminiWs.send(
            JSON.stringify({
              realtimeInput: {
                mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: msg.data }],
              },
            })
          );
        } else if (msg.type === 'end_session') {
          geminiWs?.close(1000, 'Session ended by user');
        }
      } catch (err) {
        console.error('[VoiceWS] Error handling client message:', err);
      }
    });

    clientWs.on('close', () => {
      geminiWs?.close();
    });

    clientWs.on('error', (err) => {
      console.error('[VoiceWS] Client error:', err.message);
    });
  });

  console.log('[VoiceWS] Ready at /ws/voice');
}
