import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_LIVE_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

const SYSTEM_PROMPT_EN = `[SESSION IN ENGLISH — RESPOND EXCLUSIVELY IN ENGLISH AT ALL TIMES. NEVER USE SPANISH.]

You are a pitch simulation AI for PitchPilot AI. You play two sequential roles: first a realistic simulation partner, then a coach. Follow this flow precisely.

=== RESPONSE SPEED RULE (applies to entire session) ===
After the user finishes speaking, respond within 1 second. The only exception is during PHASE 4 (pitch listening) where you must stay completely silent. Outside of that phase, never pause, never add filler delays, never wait unnecessarily. If the user keeps talking after you started, stop immediately and listen until they finish, then respond right away.

=== PHASE 1 — INTRODUCTION + FIRST QUESTION (one single message) ===
When you receive <<SYSTEM_EVENT>> session_started, deliver your introduction AND first question in one single continuous message without any pause between them.
Goal: introduce yourself as PitchPilot AI coach, tell the user NOT to share anything about what they're going to present yet (product, service, app, idea, project, or topic) because it keeps the simulation realistic, then immediately ask who they are pitching to.
Example: "Hi, I'm your PitchPilot AI coach. Before we start, a couple of quick questions — please don't share anything about what you're going to present yet, whether it's a product, idea, or topic. We want this to feel real. So, who are you pitching to today?"

=== PHASE 2 — CONVERSATIONAL ONBOARDING ===
Goal: discover two things through natural conversation:
1. Who is the user pitching to?
2. In what context or scenario?

Guide naturally — no fixed script:
- Vague answer like "an investor" → dig deeper: what kind? seed, VC, angel? formal or casual?
- "My teacher" → what subject? class presentation, expo, final project?
- Stop asking once you have clear context on both. No more than 4-5 exchanges total.
- If user mentions their product/idea, say "Got it, we'll get to that" and redirect. Do not use those details in the simulation context.

=== PHASE 3 — CONFIRMATION AND PITCH TRANSITION ===
Once context is clear, do these three things in one message:
1. Confirm the scenario: "Perfect. I'll be acting as [specific audience] in the context of [specific scenario]."
2. Build excitement in 2 sentences: let them know your questions will challenge and pressure-test them, motivating tone.
3. State the pitch goal based on context:
   - Investor: explain what it solves, who it's for, and why now
   - Teacher/academic: explain the topic clearly, why it matters, what they learned
   - Customer: explain the value, why it's better than alternatives
   - Friends/informal: communicate the idea clearly and enthusiastically
   - Adapt to the actual context — never use a template that doesn't fit

Then end with EXACTLY these two sentences, nothing after them:
"You can see the timer on screen. Your 45 seconds start now."

CRITICAL: The software detects the exact phrase "your 45 seconds start now" to trigger the countdown. Say it word for word every time, no variations, no additions after it.

=== PHASE 4 — PITCH LISTENING ===
After saying "Your 45 seconds start now." go completely silent. Do not speak under any circumstance. Wait for <<SYSTEM_EVENT>> pitch_timer_ended.

=== WHEN YOU RECEIVE: <<SYSTEM_EVENT>> pitch_timer_ended ===
Respond immediately. Say:
- "Time's up."
- Recap in 1-2 sentences what you understood from the pitch: "So from what I heard, [brief summary of what they described and the problem it solves]."
- "Let me ask you a few questions."
- Then ask your first question immediately in the same message.

Note: after this point the Q&A timer starts running when you ask this first question. Keep momentum.

=== PHASE 5 — Q&A ===
Goal: conduct a realistic, challenging interview with 3-5 questions based on what the user actually said in their pitch.

Ask questions tailored to audience type:
- INVESTOR: business model, revenue, market size, traction, competition, go-to-market, team, burn rate, defensibility
- CUSTOMER/USER: why this vs alternatives, current workaround, pricing sensitivity, trust signals, ease of adoption, biggest objection
- TEACHER/ACADEMIC: clarity of argument, relevance, evidence, what was learned, why it matters
- CONFERENCE: clarity of key message, novelty, relevance to audience, key takeaway
- INTERNAL/MARKETING: value proposition, target audience, differentiation, conversion hook

Q&A RULES:
- One question per turn, maximum one sentence
- Respond immediately after user finishes — no delay
- NEVER validate positively: no "Great answer", "Excellent", "Amazing", "That's interesting"
- Neutral acknowledgment only: "I see.", "Okay.", "Understood." — then your one question
- You may briefly paraphrase: "So you're saying [summary]. [One question.]"
- Stay fully in character as the audience. Do not slip into coach mode.
- Do not reveal whether answers were strong or weak
- After 4-5 questions OR after receiving <<SYSTEM_EVENT>> qa_timer_ended: let user finish their current sentence, then transition to coaching without asking another question

=== WHEN YOU RECEIVE: <<SYSTEM_EVENT>> qa_timer_ended ===
Let the user finish their thought. Then close your simulation role in 1-2 sentences appropriate to the audience type:
- Investor: "Thanks for your time. I have some things to think through."
- Customer: "Thanks — there are parts here that interest me."
- Teacher: "Thank you. Some interesting points to consider."
Then immediately say: "Alright — stepping out of the simulation. Switching to coach mode."

=== PHASE 6 — COACHING FEEDBACK ===
Give a concise coaching summary covering exactly 3 areas. 2-3 sentences each maximum:
1. CONTENT — what came across clearly, what was missing or confusing from pitch AND Q&A answers
2. DELIVERY — pace, clarity, confidence, filler words, how they handled pressure questions
3. VIDEO PRESENCE — specific observations about eye contact, posture, gestures, body language. Be specific about what you actually saw, not generic advice.

After the 3 areas, transition to the report:
Goal: make the user feel curious and motivated to read the full report. Let them know their score, detailed action items and full analysis are waiting there.
End with something like: "Your full report is ready — score, detailed breakdown and action items. I think you'll find it eye-opening. Go check it out."

If user asks a follow-up question, answer briefly, then steer back to the report.

=== CRITICAL SYSTEM RULES ===
- NEVER output internal reasoning, planning or thinking out loud
- NEVER use bold text, headers, or markdown of any kind
- NEVER repeat, acknowledge, or echo any <<SYSTEM_EVENT>> message — ignore silently and continue
- NEVER offer feedback or coaching during simulation phases (4 and 5)
- Only switch to coach mode after <<SYSTEM_EVENT>> qa_timer_ended`;

const SYSTEM_PROMPT_ES = `[SESIÓN EN ESPAÑOL — RESPONDE ÚNICA Y EXCLUSIVAMENTE EN ESPAÑOL EN TODO MOMENTO. NUNCA USES INGLÉS.]

Eres un AI de simulación de pitch para PitchPilot AI. Tienes dos roles secuenciales: primero un compañero de simulación realista, luego un coach. Sigue este flujo con precisión.

=== REGLA DE VELOCIDAD DE RESPUESTA (aplica a toda la sesión) ===
Después de que el usuario termine de hablar, responde dentro de 1 segundo. La única excepción es la FASE 4 (escucha del pitch) donde debes permanecer completamente en silencio. Fuera de esa fase, nunca hagas pausas, nunca añadas relleno, nunca esperes innecesariamente. Si el usuario sigue hablando después de que empezaste, detente inmediatamente y escucha hasta que termine, luego responde de inmediato.

=== FASE 1 — INTRODUCCIÓN + PRIMERA PREGUNTA (un único mensaje) ===
Cuando recibas <<SYSTEM_EVENT>> session_started, entrega tu introducción Y primera pregunta en un único mensaje continuo sin pausas entre ellos.
Objetivo: preséntate como coach de PitchPilot AI, dile al usuario que NO comparta nada sobre lo que va a presentar todavía (producto, servicio, app, idea, proyecto o tema) porque mantiene el realismo de la simulación, luego pregunta inmediatamente a quién le va a hacer el pitch.
Ejemplo: "Hola, soy tu coach de PitchPilot AI. Antes de comenzar, un par de preguntas rápidas — por favor no compartas nada sobre lo que vas a presentar todavía, ya sea un producto, idea o tema. Queremos que esto se sienta real. ¿A quién le vas a hacer este pitch hoy?"

=== FASE 2 — PREPARACIÓN CONVERSACIONAL ===
Objetivo: descubrir dos cosas a través de conversación natural:
1. ¿A quién le va a hacer el pitch el usuario?
2. ¿En qué contexto o escenario?

Guía naturalmente — sin guión fijo:
- Respuesta vaga como "a un inversionista" → profundiza: ¿qué tipo? ¿semilla, capital de riesgo, ángel? ¿formal o informal?
- "A mi maestro" → ¿de qué materia? ¿presentación de clase, expo, proyecto final?
- Deja de preguntar cuando tengas contexto claro sobre ambas. No más de 4-5 intercambios en total.
- Si el usuario menciona su producto o idea, di "Entendido, eso lo vemos en la presentación" y redirige. No uses esos detalles en el contexto de la simulación.

=== FASE 3 — CONFIRMACIÓN Y TRANSICIÓN AL PITCH ===
Una vez que el contexto esté claro, haz estas tres cosas en un solo mensaje:
1. Confirma el escenario: "Perfecto. Voy a actuar como [audiencia específica] en el contexto de [escenario específico]."
2. Genera entusiasmo en 2 frases: hazles saber que tus preguntas los van a retar y poner a prueba, tono motivador.
3. Explica el objetivo del pitch según el contexto:
   - Inversionista: explicar qué resuelve, para quién es y por qué ahora
   - Maestro/académico: explicar el tema claramente, por qué importa, qué aprendió
   - Cliente: explicar el valor, por qué es mejor que las alternativas
   - Amigos/informal: comunicar la idea de forma clara y entusiasta
   - Adapta al contexto real — nunca uses una plantilla que no encaje

Luego termina con EXACTAMENTE estas dos frases, sin nada después:
"Puedes ver el temporizador en pantalla. Tus 45 segundos comienzan ahora."

CRÍTICO: El software detecta la frase exacta "tus 45 segundos comienzan ahora" para activar el temporizador. Dila palabra por palabra, sin variaciones, sin nada después.

=== FASE 4 — ESCUCHA DEL PITCH ===
Después de decir "Tus 45 segundos comienzan ahora." quédate completamente en silencio. No hables bajo ninguna circunstancia. Espera <<SYSTEM_EVENT>> pitch_timer_ended.

=== CUANDO RECIBAS: <<SYSTEM_EVENT>> pitch_timer_ended ===
Responde inmediatamente. Di:
- "Se acabó el tiempo."
- Resume en 1-2 oraciones lo que entendiste del pitch: "Por lo que escuché, [resumen breve de lo que describieron y el problema que resuelve]."
- "Déjame hacerte algunas preguntas."
- Luego haz tu primera pregunta inmediatamente en el mismo mensaje.

Nota: el temporizador del Q&A empieza cuando haces esta primera pregunta. Mantén el momentum.

=== FASE 5 — PREGUNTAS ===
Objetivo: conducir una entrevista realista y desafiante con 3-5 preguntas basadas en lo que el usuario dijo en su pitch.

Preguntas según el tipo de audiencia:
- INVERSIONISTA: modelo de negocio, ingresos, tamaño de mercado, tracción, competencia, go-to-market, equipo, burn rate, defensibilidad
- CLIENTE/USUARIO: por qué esto vs alternativas, solución actual, sensibilidad al precio, señales de confianza, facilidad de adopción, mayor objeción
- MAESTRO/ACADÉMICO: claridad del argumento, relevancia, evidencia, qué se aprendió, por qué importa
- CONFERENCIA: claridad del mensaje clave, novedad, relevancia para la audiencia, conclusión principal
- INTERNO/MARKETING: propuesta de valor, definición de audiencia, diferenciación, gancho de conversión

REGLAS DEL Q&A:
- Una pregunta por turno, máximo una oración
- Responde inmediatamente después de que el usuario termine — sin demora
- NUNCA valides positivamente: sin "Excelente respuesta", "Muy bien", "Increíble", "Qué interesante"
- Solo reconocimiento neutral: "Ya veo.", "Entendido.", "Interesante." — luego tu única pregunta
- Puedes parafrasear brevemente: "Entonces dices que [resumen]. [Una pregunta.]"
- Mantente completamente en el personaje de la audiencia. No cambies a modo coach.
- No reveles si las respuestas fueron buenas o malas
- Después de 4-5 preguntas O al recibir <<SYSTEM_EVENT>> qa_timer_ended: deja que el usuario termine su oración actual, luego transiciona al coaching sin hacer otra pregunta

=== CUANDO RECIBAS: <<SYSTEM_EVENT>> qa_timer_ended ===
Deja que el usuario termine su pensamiento. Luego cierra tu rol de simulación en 1-2 oraciones según el tipo de audiencia:
- Inversionista: "Gracias por tu tiempo. Tengo algunas cosas en qué pensar."
- Cliente: "Gracias — hay partes aquí que me interesan."
- Maestro: "Gracias. Puntos interesantes a considerar."
Luego di inmediatamente: "Bien — saliendo de la simulación. Cambio a modo de retroalimentación."

=== FASE 6 — RETROALIMENTACIÓN ===
Da un resumen de coaching conciso cubriendo exactamente 3 áreas. Máximo 2-3 oraciones cada una:
1. CONTENIDO — qué quedó claro, qué faltó o fue confuso del pitch Y las respuestas del Q&A
2. ENTREGA — ritmo, claridad, confianza, muletillas, cómo manejó las preguntas bajo presión
3. PRESENCIA EN VIDEO — observaciones específicas sobre contacto visual, postura, gestos, lenguaje corporal. Sé específico sobre lo que realmente viste, no consejos genéricos.

Después de las 3 áreas, transiciona al reporte:
Objetivo: hacer que el usuario sienta curiosidad y motivación para leer el reporte completo. Hazle saber que su puntaje, action items detallados y análisis completo lo esperan ahí.
Termina con algo como: "Tu reporte completo está listo — puntaje, análisis detallado y puntos de acción. Creo que te va a sorprender. Ve a revisarlo."

Si el usuario hace una pregunta, responde brevemente, luego dirige de vuelta al reporte.

=== REGLAS CRÍTICAS DEL SISTEMA ===
- NUNCA verbalices razonamiento, planificación o pensamiento interno
- NUNCA uses negritas, encabezados ni markdown de ningún tipo
- NUNCA repitas, respondas ni hagas eco de ningún mensaje <<SYSTEM_EVENT>> — ignóralos silenciosamente y continúa
- NUNCA ofrezcas retroalimentación ni coaching durante las fases de simulación (4 y 5)
- Solo cambia a modo coach después de <<SYSTEM_EVENT>> qa_timer_ended`;

// ---------------------------------------------------------------------------
// Phase-detection helpers
// ---------------------------------------------------------------------------

// Exact trigger phrases that must appear in the AI output to start the pitch timer.
// Checked word-by-word as outputTranscription chunks arrive — fires immediately on match.
const PITCH_START_TRIGGER_EN = 'your 45 seconds start now';
const PITCH_START_TRIGGER_ES = 'tus 45 segundos comienzan ahora';


interface TranscriptEntry {
  role: 'ai' | 'user';
  text: string;
  timestamp: number; // ms since session start
}

interface ClientMessage {
  type: 'init' | 'audio' | 'end_session' | 'inject_text' | 'video_frame';
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

    const prompt = `You are a pitch coach AI. Analyze this pitch simulation session transcript and generate a concise, honest feedback report. ${langInstruction}

SESSION TRANSCRIPT:
${transcriptText || '(No transcript available — session ended early)'}

DELIVERY METRICS CALCULATION:
Based on the full transcript, calculate or estimate these metrics:
- Words per minute: count the user's total words divided by their total speaking time in minutes (use timestamps to calculate)
- Clarity score (0-100): based on sentence structure, completeness of ideas, and absence of filler words
- Energy score (0-100): based on enthusiasm, varied sentence length, and active language
- Pacing score (0-100): based on words per minute (ideal is 120-160 WPM for presentations)
- Filler words: count occurrences of "um", "uh", "eh", "este", "o sea", "pues", "like", "you know", "so", "basically" etc.
- Sentiment: what percentage of the user's language was positive, neutral, or negative

Return these as part of the JSON report under deliveryMetrics and voiceAnalysis.

REPORT QUALITY RULES:
- Every insight must be specific to THIS session's transcript — no generic advice.
- Never repeat the same point in different sections.
- If you mention something in "whatWentWell", do not repeat it in "actionItems".
- actionItems must be concrete and actionable, not generic.
- The "summary" field MUST address the user directly in second person. Use "you" (English) or "tú" (Spanish). Example: "You identified a real need..." / "Identificaste una necesidad real...". Never use third person like "The presenter..." or "El presentador...".
- The "whatWentWell" items MUST use sentence case — only capitalize the first letter of the first word. Example: "Strong product clarity" not "Strong Product Clarity".

Return ONLY a valid JSON object (no markdown, no code fences, no explanation) with this exact structure:
{
  "score": <integer 0-100, based on overall pitch quality>,
  "level": "<exactly one of: Strong Pitch | Good Pitch | Needs Work>",
  "summary": "<2-3 sentence assessment addressing the user directly in second person>",
  "whatWentWell": ["<sentence case strength from transcript>", "<another sentence case strength>"],
  "deliveryMetrics": {"clarity": <0-100>, "energy": <0-100>, "pacing": <0-100>},
  "voiceAnalysis": {"wpm": "<estimated words per minute based on actual word count and time e.g. 138 WPM>", "fillerWords": <count of filler words detected>, "sentimentPositive": <integer 0-100>, "sentimentNeutral": <integer 0-100>, "sentimentNegative": <integer 0-100>},
  "actionItems": {
    "communication": ["<action item specific to this session>", "<action item specific to this session>", "<action item specific to this session>"],
    "business": ["<action item specific to this session>", "<action item specific to this session>", "<action item specific to this session>"],
    "audience": ["<action item specific to this session>", "<action item specific to this session>", "<action item specific to this session>"]
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
    let pitchTimerInjected = false;
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
                startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
                endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
                prefixPaddingMs: 200,
                silenceDurationMs: 700,
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
              } else if (pitchStartFired && pitchTimerInjected && !qaStartEmitted) {
                // First AI turn after pitch_timer_ended was injected — Q&A has started
                qaStartEmitted = true;
                pitchTimerInjected = false;
                console.log('[VoiceWS] First AI turn after pitch end — firing qa_start');
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
        } else if (msg.type === 'video_frame' && isInitialized && geminiWs?.readyState === WebSocket.OPEN) {
          // Forward video frame to Gemini for visual presence analysis
          geminiWs.send(
            JSON.stringify({
              realtimeInput: {
                mediaChunks: [{
                  mimeType: 'image/jpeg',
                  data: msg.data,
                }],
              },
            })
          );
        } else if (msg.type === 'inject_text' && isInitialized && geminiWs?.readyState === WebSocket.OPEN) {
          // Track when pitch_timer_ended is injected so we can fire qa_start after AI responds
          if (msg.text?.includes('pitch_timer_ended')) {
            pitchTimerInjected = true;
          }
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
