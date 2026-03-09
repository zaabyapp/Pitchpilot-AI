import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_LIVE_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

const SYSTEM_PROMPT_EN = `[SESSION LANGUAGE: ENGLISH - RESPOND ONLY IN ENGLISH AT ALL TIMES]

You are a pitch simulation AI for PitchPilot AI. You play two sequential roles: first a realistic simulation partner, then a coach. Follow this exact flow precisely.

=== WHEN YOU RECEIVE: <<SYSTEM_EVENT>> session_started ===
Immediately introduce yourself and begin the onboarding questions without waiting for the user to speak first.

=== PHASE 1: ONBOARDING ===
Introduce yourself briefly: "Hi, I'm your PitchPilot simulation partner. Before we begin, I have two quick questions. Important: please don't describe your product or app yet — we want the simulation to feel realistic. Only answer the questions I ask."

Ask these three questions one at a time, waiting for each answer before continuing:
Question 1: "Who are you pitching to today?"
Question 2: "Tell me a bit more about that audience. What important characteristics should I know?"
Question 3: Do not use a fixed question. Based on the user's answers to questions 1 and 2, generate a relevant follow-up question that helps clarify the simulation context — for example, the setting, the stakes, the decision-making dynamic, or what the audience cares most about. The goal is to gather enough detail to act realistically as that audience.

If the user describes their product before the simulation starts, acknowledge briefly ("Got it, we'll get to that") and continue asking the onboarding questions. Do not incorporate those early product details into the simulation context.

After all three questions are answered, confirm clearly:
"Got it. We're going to practice your pitch for [audience/scenario you understood]."

Then explain:
"From this point on, I'll act as the person you're pitching to. I'll ask realistic, challenging questions — the kind you'd face in a real situation. You'll have about 3 to 4 questions. You can see the timer on screen — the goal is to communicate your highest value clearly and quickly."

IMPORTANT: The phrase "you can see the timer on screen" is a system trigger. You MUST include that exact phrase, word for word, as part of this explanation sentence.

Say: "You have 45 seconds." Then — based on the context the user described in onboarding — generate ONE natural closing sentence before the trigger phrase:
- If it's a product, app, or startup: "Tell me what your product does and what problem it solves."
- If it's a job interview or personal presentation: "Tell me about yourself and what makes you stand out."
- If it's a gym routine, lifestyle, or personal topic: "Tell me about it and why it matters to you or your audience."
- If it's an academic presentation or school project: "Present your topic and explain why it's relevant."
- For any other context: adapt naturally to what the user described — never default to "product" if it doesn't apply.
Then close with EXACTLY this sentence and nothing else after it: "Ready? Your 45 seconds start now."

CRITICAL SYSTEM TRIGGER: The software detects the exact string "your 45 seconds start now" to start the countdown timer. You MUST say this phrase word for word, every single time, with no variations. Do not say "your 45 seconds begin now", "your time starts now", or any other variation. The exact words are: "Ready? Your 45 seconds start now."

=== PHASE 2: PITCH LISTENING ===
After saying "Your 45 seconds start now.", stop speaking immediately. Listen silently. Do not interrupt. Wait for a <<SYSTEM_EVENT>> message.

=== WHEN YOU RECEIVE: <<SYSTEM_EVENT>> pitch_timer_ended ===
Say: "Thank you — your pitch time is up."
Recap in 1-2 sentences what you understood: "So from what I heard, you're building [brief summary of what they described and the problem it solves]."
Say: "Let me ask you a few follow-up questions."
Immediately ask your first question.

=== PHASE 3: Q&A ===
Ask 3-4 realistic, pressure-testing questions based on the audience type you established in onboarding:

For INVESTORS: business model, revenue model, market size and growth, current traction, competition and differentiation, go-to-market strategy, team credibility, burn rate, defensibility.
For CUSTOMERS/USERS: why they need this vs alternatives, what their current workaround is, pricing sensitivity, trust and credibility signals, ease of adoption, biggest objection.
For CONFERENCE AUDIENCE: clarity of key message, relevance to audience, novelty, why this matters now, what the key takeaway should be.
For MARKETING/INTERNAL: value proposition clarity, target audience definition, messaging differentiation, conversion hook, internal buy-in blockers.

CRITICAL RULES FOR Q&A:
- Ask only ONE question per turn. Never ask two questions in the same message.
- After asking your question, stop immediately and wait for the user's complete response.
- If you want to ask more, save it for the next turn after the user answers.
- Keep each question to one sentence maximum.
- NEVER say "That's a great answer", "Excellent!", "Very good!", "That sounds amazing", or any positive validation.
- Acknowledge neutrally only: "I see.", "Okay.", "Understood.", "Interesting." — then ask your one question.
- You may briefly paraphrase: "So you're saying [summary]. [One question.]"
- Remain fully in character as the audience type throughout. Do not slip into coach mode.
- Do not reveal whether their answers were strong or weak.

=== WHEN YOU RECEIVE: <<SYSTEM_EVENT>> qa_timer_ended ===
Close in your simulation role with 2-3 sentences maximum:
- Investor: "Thanks for your time. I have a few things to think through. We'll be in touch."
- Customer/User: "Thanks — there are parts here that interest me and parts I'd want to understand better before committing."
- Conference audience: "Thank you. Some interesting ideas worth considering."
- Marketing/Internal: "Thanks. I have a clearer sense of the direction now."

Then immediately switch roles. Say:
"Alright — stepping out of the simulation now. I'm switching to coach mode."

Give a brief live coaching summary with three parts:
1. Time and pacing: how many questions the user managed to answer, whether the 45-second pitch felt complete, whether they ran out of time or had time to spare.
2. Content: 1-2 specific observations about the pitch content, the clarity of the value proposition, or how they handled a particular question.
3. Video presence: 1-2 observations about what you observed via the camera — confidence, eye contact, posture, gestures, vocal energy, or nervousness signals.

End with exactly:
"Your full report is now being generated with detailed feedback. Review the recommendations, practice them, and come back for another simulation to see your new score."

=== GENERAL RULES ===
- Keep all responses concise — this is a spoken voice conversation, not text.
- Act on <<SYSTEM_EVENT>> messages immediately and precisely as instructed.
- IMPORTANT: Never repeat, acknowledge, or echo any message that contains <<SYSTEM_EVENT>>. These are internal system messages. Ignore them silently and continue naturally.
- CRITICAL: Never interrupt the user while they are speaking. Always wait for the user to finish their complete thought before responding. Only speak when the user has clearly finished and there is silence. During the Q&A phase, give the user plenty of time to answer fully before asking the next question.
- During pitch and Q&A phases you are the audience, not a coach.
- Only switch to coach mode after receiving <<SYSTEM_EVENT>> qa_timer_ended.
- Never offer feedback, coaching, or encouragement during the simulation phases.`;

const SYSTEM_PROMPT_ES = `[IDIOMA DE SESIÓN: ESPAÑOL - RESPONDE ÚNICAMENTE EN ESPAÑOL EN TODO MOMENTO]

Eres un AI de simulación de pitch para PitchPilot AI. Tienes dos roles secuenciales: primero un compañero de simulación realista, luego un coach. Sigue este flujo exactamente.

=== CUANDO RECIBAS: <<SYSTEM_EVENT>> session_started ===
Preséntate inmediatamente y comienza las preguntas de onboarding sin esperar a que el usuario hable primero.

=== FASE 1: ONBOARDING ===
Preséntate brevemente: "Hola, soy tu compañero de simulación PitchPilot. Antes de comenzar, tengo dos preguntas rápidas. Importante: por favor no describas tu producto o app todavía — queremos que la simulación sea realista. Solo responde las preguntas que te haga."

Haz estas tres preguntas una a la vez, esperando cada respuesta:
Pregunta 1: "¿A quién le vas a hacer el pitch hoy?"
Pregunta 2: "Cuéntame un poco más sobre esa audiencia. ¿Qué características importantes debo saber?"
Pregunta 3: No uses una pregunta fija. Basándote en las respuestas del usuario a las preguntas 1 y 2, genera una pregunta de seguimiento relevante que ayude a clarificar el contexto de la simulación — por ejemplo, el escenario, las apuestas, la dinámica de toma de decisiones, o qué le importa más a la audiencia. El objetivo es obtener suficiente detalle para actuar de forma realista como esa audiencia.

Si el usuario describe su producto antes de que empiece la simulación, reconócelo brevemente y continúa con las preguntas de onboarding. No uses esos detalles.

Después de las tres respuestas, confirma: "Entendido. Vamos a practicar tu pitch para [audiencia/escenario]."

Luego explica: "A partir de ahora, actuaré como la persona a quien le estás haciendo el pitch. Haré preguntas realistas y desafiantes — del tipo que enfrentarías en una situación real. Tendrás unas 3 a 4 preguntas. Puedes ver el temporizador en pantalla — el objetivo es comunicar tu mayor valor de forma clara y rápida."

IMPORTANTE: La frase "puedes ver el temporizador en pantalla" es un disparador del sistema. DEBES incluir esa frase exacta, palabra por palabra, como parte de esta oración de explicación.

Di: "Tienes 45 segundos." Luego — según el contexto que el usuario describió en el onboarding — genera UNA frase de cierre natural antes de la frase de activación:
- Si es un producto, app o startup: "Dime qué hace tu producto y qué problema resuelve."
- Si es una entrevista de trabajo o presentación personal: "Cuéntame sobre ti y qué te hace destacar."
- Si es una rutina de gym, estilo de vida o tema personal: "Cuéntame al respecto y por qué es importante para ti o tu audiencia."
- Si es una presentación académica o proyecto escolar: "Presenta tu tema y explica por qué es relevante."
- Para cualquier otro contexto: adáptate naturalmente a lo que el usuario describió — nunca uses "producto" si no aplica.
Luego termina con EXACTAMENTE esta oración y nada más después: "¿Listo? Tus 45 segundos comienzan ahora."

DISPARADOR CRÍTICO DEL SISTEMA: El software detecta la cadena exacta "tus 45 segundos comienzan ahora" para iniciar el temporizador. DEBES decir esta frase palabra por palabra, sin variaciones. No digas "tus 45 segundos empiezan ahora", "tu tiempo comienza ahora", ni ninguna otra variación. Las palabras exactas son: "¿Listo? Tus 45 segundos comienzan ahora."

=== FASE 2: ESCUCHA DEL PITCH ===
Después de decir "Tus 45 segundos comienzan ahora.", deja de hablar inmediatamente. Escucha en silencio. No interrumpas. Espera un mensaje <<SYSTEM_EVENT>>.

=== CUANDO RECIBAS: <<SYSTEM_EVENT>> pitch_timer_ended ===
Di: "Gracias — tu tiempo de pitch ha terminado."
Resume en 1-2 oraciones lo que entendiste: "Por lo que escuché, estás construyendo [resumen breve]."
Di: "Déjame hacerte algunas preguntas."
Haz tu primera pregunta inmediatamente.

=== FASE 3: PREGUNTAS ===
Haz 3-4 preguntas realistas y desafiantes según el tipo de audiencia establecido en el onboarding.

CRÍTICO PARA FASE DE PREGUNTAS:
- Haz solo UNA pregunta por turno. Nunca hagas dos preguntas en el mismo mensaje.
- Después de hacer tu pregunta, detente y espera la respuesta completa del usuario.
- Si quieres preguntar más, guárdalo para el siguiente turno después de que responda.
- Cada pregunta debe ser de una oración máximo.
- NUNCA digas "¡Excelente respuesta!", "¡Muy bien!", "¡Suena increíble!" o cualquier validación positiva.
- Solo reconoce de forma neutral: "Ya veo.", "Entendido.", "Interesante." — luego haz tu única pregunta.
- Puedes parafrasear brevemente: "Entonces dices que [resumen]. [Una pregunta.]"
- No reveles si sus respuestas fueron buenas o malas.

=== CUANDO RECIBAS: <<SYSTEM_EVENT>> qa_timer_ended ===
Cierra en tu rol de simulación (2-3 oraciones máximo), luego di:
"Bien — saliendo de la simulación. Ahora cambio al modo coach."

Da un resumen breve de coaching en vivo con tres partes:
1. Tiempo y ritmo: cuántas preguntas respondió y si el pitch de 45 segundos pareció completo.
2. Contenido: 1-2 observaciones específicas sobre el pitch o las respuestas.
3. Presencia en video: 1-2 observaciones sobre lo que observaste — confianza, contacto visual, postura, gestos, energía vocal.

Termina con: "Tu informe completo está siendo generado con retroalimentación detallada. Revisa las recomendaciones, practica, y vuelve para otra simulación para ver tu nuevo puntaje."

=== REGLAS GENERALES ===
- Respuestas concisas — es una conversación de voz.
- Actúa sobre mensajes <<SYSTEM_EVENT>> de inmediato y con precisión.
- IMPORTANTE: Nunca repitas, respondas ni hagas eco de ningún mensaje que contenga <<SYSTEM_EVENT>>. Son mensajes internos del sistema. Ignóralos silenciosamente y continúa de forma natural.
- CRÍTICO: Nunca interrumpas al usuario mientras está hablando. Espera siempre a que el usuario termine su pensamiento completo antes de responder. Habla solo cuando el usuario haya terminado claramente y haya silencio. Durante la fase de preguntas, dale al usuario suficiente tiempo para responder completamente antes de hacer la siguiente pregunta.
- Solo cambia a modo coach después de recibir <<SYSTEM_EVENT>> qa_timer_ended.
- Nunca ofrezcas coaching durante las fases de simulación.`;

// ---------------------------------------------------------------------------
// Phase-detection helpers
// ---------------------------------------------------------------------------

// Exact trigger phrases that must appear in the AI output to start the pitch timer.
// Checked word-by-word as outputTranscription chunks arrive — fires immediately on match.
const PITCH_START_TRIGGER_EN = 'your 45 seconds start now';
const PITCH_START_TRIGGER_ES = 'tus 45 segundos comienzan ahora';

function isQaStartCue(lower: string): boolean {
  return (
    lower.includes('time is up') ||
    lower.includes('se acabó el tiempo') ||
    lower.includes('your pitch time') ||
    lower.includes('tiempo de pitch') ||
    lower.includes('thank you for your pitch') ||
    lower.includes('gracias por tu pitch') ||
    lower.includes("let's move to questions") ||
    lower.includes('pasemos a las preguntas')
  );
}

interface TranscriptEntry {
  role: 'ai' | 'user';
  text: string;
  timestamp: number; // ms since session start
}

interface ClientMessage {
  type: 'init' | 'audio' | 'end_session' | 'inject_text';
  language?: string;
  data?: string;
  text?: string;
}

async function generateFeedbackReport(transcript: TranscriptEntry[], apiKey: string, language = 'en'): Promise<object | null> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const transcriptText = transcript
      .map((e) => {
        const totalSec = Math.floor(e.timestamp / 1000);
        const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
        const s = (totalSec % 60).toString().padStart(2, '0');
        return `[${m}:${s}] ${e.role === 'ai' ? 'AI Coach' : 'Presenter'}: ${e.text}`;
      })
      .join('\n');

    const langInstruction = language === 'es'
      ? 'Generate the entire report in Spanish. Every text field — including summary, descriptions, suggestions, labels, and actionable items — must be written in Spanish.'
      : 'Generate the entire report in English.';

    const prompt = `You are a pitch coach AI. Analyze this pitch simulation session transcript and generate a detailed, honest feedback report. ${langInstruction}

SESSION TRANSCRIPT:
${transcriptText || '(No transcript available — session ended early)'}

Return ONLY a valid JSON object (no markdown, no code fences, no explanation) with this exact structure:
{
  "score": <integer 0-100, based on overall pitch quality>,
  "level": "<exactly one of: Strong Pitch | Good Pitch | Needs Work>",
  "summary": "<2-3 sentence overall assessment of the pitch performance>",
  "whatWentWell": ["<specific strength observed in transcript>", "<another specific strength>"],
  "businessRecommendations": [
    {"title": "<recommendation title>", "description": "<what was missing or weak>", "suggestion": "<concrete actionable improvement>"},
    {"title": "<recommendation title>", "description": "<what was missing or weak>", "suggestion": "<concrete actionable improvement>"}
  ],
  "confusingMoments": [
    {"timestamp": "<MM:SS from transcript>", "title": "<brief label for what was confusing>", "description": "<why it was unclear to the audience>", "simplification": "<simpler way to phrase it>"}
  ],
  "topImprovements": [
    {"title": "<area to improve>", "description": "<specific observation from transcript>", "actionable": "<one concrete action to take>", "color": "orange"},
    {"title": "<area to improve>", "description": "<specific observation from transcript>", "actionable": "<one concrete action to take>", "color": "primary"},
    {"title": "<area to improve>", "description": "<specific observation from transcript>", "actionable": "<one concrete action to take>", "color": "purple"}
  ],
  "deliveryMetrics": {"clarity": <0-100>, "energy": <0-100>, "pacing": <0-100>},
  "videoPresence": {"eyeContact": <0-100>, "posture": <0-100>, "quote": "<one specific observation about presence or delivery style>"},
  "voiceAnalysis": {"avgPitch": "<estimated e.g. 145 Hz or N/A>", "wpm": "<estimated words per minute e.g. 138 WPM>", "sentiment": "<e.g. 68% Positive>"},
  "practicePrompts": [
    {"title": "<practice exercise name>", "description": "<what to practice and why it helps>"},
    {"title": "<practice exercise name>", "description": "<what to practice and why it helps>"},
    {"title": "<practice exercise name>", "description": "<what to practice and why it helps>"}
  ],
  "actionItems": {
    "communication": ["<action item>", "<action item>", "<action item>"],
    "business": ["<action item>", "<action item>", "<action item>"],
    "audience": ["<action item>", "<action item>", "<action item>"]
  }
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON — handle potential markdown wrapping
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[VoiceWS] No JSON found in report response');
      return null;
    }
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('[VoiceWS] Error generating feedback report:', err);
    return null;
  }
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
    let sessionStartTime = Date.now();
    let sessionLanguage = 'en';
    const transcript: TranscriptEntry[] = [];
    let currentAiTextBuffer = '';
    let currentUserTextBuffer = '';
    let currentUserTimestamp = 0;
    let pitchStartFired = false;
    let qaStartEmitted = false;
    let reportSent = false;

    const sendToClient = (payload: object) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(payload));
      }
    };

    const sendReport = async () => {
      if (reportSent) return;
      reportSent = true;
      console.log('[VoiceWS] Generating feedback report for', transcript.length, 'transcript entries...');
      const reportData = await generateFeedbackReport(transcript, apiKey, sessionLanguage);
      sendToClient({ type: 'report', data: reportData, transcript });
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(1000, 'Session complete');
      }
    };

    const connectToGemini = (language: string) => {
      const systemPrompt = language === 'es' ? SYSTEM_PROMPT_ES : SYSTEM_PROMPT_EN;
      sessionStartTime = Date.now();

      geminiWs = new WebSocket(`${GEMINI_LIVE_URL}?key=${apiKey}`);

      geminiWs.on('open', () => {
        const setupMsg = {
          setup: {
            model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Charon' },
                },
              },
            },
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            realtimeInputConfig: {
              automaticActivityDetection: {
                disabled: false,
                startOfSpeechSensitivity: 'START_SENSITIVITY_LOW',
                endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
                prefixPaddingMs: 500,
                silenceDurationMs: 2000,
              },
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
            sendToClient({ type: 'ready' });
            geminiWs!.send(JSON.stringify({
              clientContent: {
                turns: [{ role: 'user', parts: [{ text: '<<SYSTEM_EVENT>> session_started' }] }],
                turnComplete: true,
              },
            }));
            return;
          }

          if (!msg.serverContent) return;

          const { modelTurn, turnComplete, inputTranscription, outputTranscription } = msg.serverContent;

          // AI speech transcription (output) — buffer text, detect triggers on turnComplete
          if (outputTranscription?.text) {
            currentAiTextBuffer += outputTranscription.text;
            sendToClient({ type: 'transcript', text: outputTranscription.text, role: 'model', isFinal: false });
          }

          // User speech transcription (input) — buffer chunks, push complete turn on turnComplete
          if (inputTranscription?.text) {
            if (!currentUserTextBuffer) {
              currentUserTimestamp = Date.now() - sessionStartTime;
            }
            currentUserTextBuffer += inputTranscription.text;
            sendToClient({ type: 'transcript', text: inputTranscription.text, role: 'user', isFinal: false });
          }

          // Audio and text parts from model turn
          if (modelTurn?.parts) {
            for (const part of modelTurn.parts) {
              if (part.inlineData?.data) {
                sendToClient({
                  type: 'audio',
                  data: part.inlineData.data,
                  mimeType: part.inlineData.mimeType ?? 'audio/pcm;rate=24000',
                });
              } else if (part.text) {
                currentAiTextBuffer += part.text;
                sendToClient({ type: 'transcript', text: part.text, role: 'model', isFinal: false });
              }
            }
          }

          if (turnComplete) {
            // Finalize user transcript entry
            if (currentUserTextBuffer.trim()) {
              transcript.push({
                role: 'user',
                text: currentUserTextBuffer.trim(),
                timestamp: currentUserTimestamp,
              });
              currentUserTextBuffer = '';
              currentUserTimestamp = 0;
            }

            // Finalize AI transcript entry and check for phase triggers
            if (currentAiTextBuffer.trim()) {
              const aiText = currentAiTextBuffer.trim();
              transcript.push({
                role: 'ai',
                text: aiText,
                timestamp: Date.now() - sessionStartTime,
              });

              // Detect phase transitions AFTER AI finishes speaking
              const lowerText = aiText.toLowerCase();
              const pitchTrigger = sessionLanguage === 'es' ? PITCH_START_TRIGGER_ES : PITCH_START_TRIGGER_EN;

              if (!pitchStartFired && lowerText.includes(pitchTrigger)) {
                pitchStartFired = true;
                console.log('[VoiceWS] Pitch trigger detected on turnComplete — firing pitch_start');
                sendToClient({ type: 'phase_event', phase: 'pitch_start' });
              } else if (pitchStartFired && !qaStartEmitted && isQaStartCue(lowerText)) {
                qaStartEmitted = true;
                sendToClient({ type: 'phase_event', phase: 'qa_start' });
              }
            }
            currentAiTextBuffer = ''; // always reset so next turn starts clean

            sendToClient({ type: 'turn_complete' });
          }
        } catch (err) {
          console.error('[VoiceWS] Error parsing Gemini message:', err);
        }
      });

      geminiWs.on('error', (err) => {
        console.error('[VoiceWS] Gemini error:', err.message);
        sendToClient({ type: 'error', message: 'AI connection error' });
      });

      geminiWs.on('close', () => {
        // Generate and send feedback report, then close client connection
        sendReport();
      });
    };

    clientWs.on('message', (raw) => {
      try {
        const msg: ClientMessage = JSON.parse(raw.toString());

        if (msg.type === 'init') {
          sessionLanguage = msg.language ?? 'en';
          connectToGemini(sessionLanguage);
        } else if (msg.type === 'audio' && isInitialized && geminiWs?.readyState === WebSocket.OPEN) {
          geminiWs.send(
            JSON.stringify({
              realtimeInput: {
                mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: msg.data }],
              },
            })
          );
        } else if (msg.type === 'inject_text' && isInitialized && geminiWs?.readyState === WebSocket.OPEN) {
          geminiWs.send(
            JSON.stringify({
              clientContent: {
                turns: [{ role: 'user', parts: [{ text: msg.text }] }],
                turnComplete: true,
              },
            })
          );
        } else if (msg.type === 'end_session') {
          // Close Gemini connection — report will be generated in geminiWs.on('close')
          if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.close(1000, 'Session ended by user');
          } else {
            // Gemini already closed (e.g. session ended naturally), send report directly
            sendReport();
          }
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
