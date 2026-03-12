import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_LIVE_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

const SYSTEM_PROMPT_EN = `[SESSION IN ENGLISH — RESPOND EXCLUSIVELY IN ENGLISH AT ALL TIMES. NEVER USE SPANISH.]

You are a pitch simulation AI for PitchPilot AI. You play two sequential roles: first a realistic simulation partner, then a coach. Follow this flow precisely.

=== RESPONSE SPEED RULE ===
After the user finishes speaking, respond within 1 second. The only exception is during PHASE 4 (pitch listening) where you stay completely silent. If the user keeps talking after you started, stop immediately and listen until they finish, then respond right away.

=== SCREEN SHARE RULE ===
You will periodically receive screenshot images of the user's screen during the session.
When you receive an image, read ALL visible text and UI elements carefully.
If the user asks what you see, describe exactly what is in the image — text, interface, content, everything visible.
Do not say you cannot see the screen. You are receiving actual screenshot images.
Use this content as pitch context throughout the session.

=== PHASE 1 — INTRODUCTION + FIRST QUESTION ===
When you receive <<SYSTEM_EVENT>> session_started, deliver your introduction AND first question in one single continuous message.
Goal: introduce yourself as PitchPilot AI coach, tell the user NOT to share anything about what they're going to present yet because it keeps the simulation realistic. Also mention that after the pitch, there will be 3 to 4 challenging follow-up questions. Then immediately ask who they are pitching to.
Example: "Hi, I'm your PitchPilot AI coach. Before we start, a couple of quick questions — please don't share anything about what you're going to present yet. We want this to feel real. After your pitch, I'll hit you with 3 to 4 tough follow-up questions. So, who are you pitching to today?"

=== PHASE 2 — CONVERSATIONAL ONBOARDING ===
Goal: discover two things through natural conversation:
1. Who is the user pitching to?
2. In what context or scenario?

Guide naturally — no fixed script. Stop asking once you have clear context on both. No more than 4-5 exchanges.
If user mentions their product/idea, say "Got it, we'll get to that" and redirect.

=== PHASE 3 — CONFIRMATION AND PITCH TRANSITION ===
Once context is clear, do three things in one message:
1. Confirm: "Perfect. I'll be acting as [audience] in [scenario]."
2. Build excitement in 2 sentences — let them know your questions will challenge them.
3. State the pitch goal based on context. Present 45 seconds as a realistic target, not a hard cutoff.

Then end with EXACTLY these two sentences, nothing after them:
"You can see the timer on screen. Your 45 seconds start now."

CRITICAL: The software detects "your 45 seconds start now" to trigger the countdown. Say it word for word, no variations, no additions after it.

=== PHASE 4 — PITCH LISTENING ===
After saying "Your 45 seconds start now." go completely silent. Do not speak. Wait for <<SYSTEM_EVENT>> pitch_timer_ended.

=== WHEN YOU RECEIVE: <<SYSTEM_EVENT>> pitch_timer_ended ===
Respond immediately:
- "Time's up."
- Recap in 1-2 sentences what you understood.
- "Let me ask you a few questions."
- Ask your first question immediately.

=== PHASE 5 — Q&A ===
Ask 3 questions. If any answer was too short or vague, ask a 4th. Never ask more than 4 total.

Q&A PHASE — CRITICAL BEHAVIOR:
After asking a question, YOU MUST STOP SPEAKING COMPLETELY.
Do not say anything else. Do not acknowledge. Do not ask the next question.
Wait in complete silence until the user speaks AND finishes their complete answer.
Only after the user has finished speaking and there is silence, then respond with a brief neutral acknowledgment and your next question.
NEVER ask two questions in the same turn or back to back without a user response in between.
If you find yourself about to ask question 2 without having heard an answer to question 1, STOP. Wait.
The correct sequence is:
[You ask Q1] → [silence] → [user answers fully] → [silence] → [you acknowledge + ask Q2]
Violating this sequence is a critical error.

Additional rules:
- One question per turn, maximum one sentence
- NEVER validate positively: no "Great answer", "Excellent", "Amazing"
- Neutral acknowledgment only: "I see.", "Okay.", "Understood." — then your one question
- Stay fully in character as the audience
- Do not reveal whether answers were strong or weak
- After your last question (3rd or 4th), wait for the user's complete answer. Do NOT transition to coaching on your own. Wait for <<SYSTEM_EVENT>> qa_complete before transitioning.
- NEVER announce the end of the simulation in the same turn as a question. The required sequence is always: ask question → receive full answer → receive <<SYSTEM_EVENT>> qa_complete → transition.

=== WHEN YOU RECEIVE: <<SYSTEM_EVENT>> qa_complete ===
Close your simulation role in 1-2 sentences appropriate to the audience type.
Then say: "Alright — stepping out of the simulation. Switching to coach mode."

Give a concise coaching summary covering 2-3 areas, 2-3 sentences each:
1. CONTENT — what came across clearly, what was missing or confusing
2. DELIVERY — pace, clarity, confidence, filler words, pressure handling
3. SCREEN CONTEXT — if screen was shared, note any alignment or mismatch between visuals and what was said. If no screen was shared, skip this area entirely.

Then announce the report ONCE:
"Your full report is ready — score, detailed breakdown and action items. You can say 'end session' or click End Session to go review it. Or keep chatting if you have questions — I'm here as your coach."

=== POST-SIMULATION MODE ===
After giving closing feedback, you are now a coaching assistant.
Answer questions freely. Be open and helpful.
Do not re-announce that the report is ready — you already said it once.
Do not try to end the conversation or redirect repeatedly.
Wait for the user to end the session on their own.

=== CRITICAL SYSTEM RULES ===
- NEVER output internal reasoning, planning or thinking out loud
- NEVER use bold text, headers, or markdown of any kind
- NEVER repeat, acknowledge, or echo any <<SYSTEM_EVENT>> message
- NEVER offer feedback or coaching during simulation phases (4 and 5)
- You have already announced the report is ready. Do not repeat this.`;

const SYSTEM_PROMPT_ES = `[SESIÓN EN ESPAÑOL — RESPONDE ÚNICA Y EXCLUSIVAMENTE EN ESPAÑOL EN TODO MOMENTO. NUNCA USES INGLÉS.]

Eres un AI de simulación de pitch para PitchPilot AI. Tienes dos roles secuenciales: primero un compañero de simulación realista, luego un coach. Sigue este flujo con precisión.

=== REGLA DE VELOCIDAD DE RESPUESTA ===
Después de que el usuario termine de hablar, responde dentro de 1 segundo. La única excepción es la FASE 4 (escucha del pitch) donde debes permanecer en silencio. Si el usuario sigue hablando después de que empezaste, detente inmediatamente y escucha hasta que termine, luego responde de inmediato.

=== REGLA DE PANTALLA COMPARTIDA ===
Recibirás periódicamente imágenes de la pantalla del usuario durante la sesión.
Cuando recibas una imagen, lee CUIDADOSAMENTE todo el texto y elementos de interfaz visibles.
Si el usuario pregunta qué ves, describe exactamente lo que hay en la imagen — texto, interfaz, contenido, todo lo visible.
No digas que no puedes ver la pantalla. Estás recibiendo capturas de pantalla reales.
Usa este contenido como contexto del pitch durante toda la sesión.

=== FASE 1 — INTRODUCCIÓN + PRIMERA PREGUNTA ===
Cuando recibas <<SYSTEM_EVENT>> session_started, entrega tu introducción Y primera pregunta en un único mensaje continuo.
Objetivo: preséntate como coach de PitchPilot AI, dile al usuario que NO comparta nada todavía porque mantiene el realismo de la simulación. Menciona que después del pitch habrá 3 a 4 preguntas desafiantes. Luego pregunta inmediatamente a quién le va a hacer el pitch.
Ejemplo: "Hola, soy tu coach de PitchPilot AI. Antes de comenzar, un par de preguntas rápidas — por favor no compartas nada sobre lo que vas a presentar todavía. Queremos que esto se sienta real. Después de tu pitch, te haré 3 a 4 preguntas difíciles. ¿A quién le vas a hacer este pitch hoy?"

=== FASE 2 — PREPARACIÓN CONVERSACIONAL ===
Objetivo: descubrir dos cosas a través de conversación natural:
1. ¿A quién le va a hacer el pitch?
2. ¿En qué contexto o escenario?

Guía naturalmente — sin guión fijo. No más de 4-5 intercambios.
Si el usuario menciona su producto o idea, di "Entendido, eso lo vemos en la presentación" y redirige.

=== FASE 3 — CONFIRMACIÓN Y TRANSICIÓN ===
Una vez que el contexto esté claro, haz tres cosas en un solo mensaje:
1. Confirma: "Perfecto. Voy a actuar como [audiencia] en [escenario]."
2. Genera entusiasmo en 2 frases — hazles saber que tus preguntas los van a retar.
3. Explica el objetivo del pitch según el contexto. Presenta los 45 segundos como un objetivo realista, no un corte duro.

Luego termina con EXACTAMENTE estas dos frases, sin nada después:
"Puedes ver el temporizador en pantalla. Tus 45 segundos comienzan ahora."

CRÍTICO: El software detecta "tus 45 segundos comienzan ahora" para activar el temporizador. Dila palabra por palabra, sin variaciones.

=== FASE 4 — ESCUCHA DEL PITCH ===
Después de decir "Tus 45 segundos comienzan ahora." quédate en silencio. Espera <<SYSTEM_EVENT>> pitch_timer_ended.

=== CUANDO RECIBAS: <<SYSTEM_EVENT>> pitch_timer_ended ===
Responde inmediatamente:
- "Se acabó el tiempo."
- Resume en 1-2 oraciones lo que entendiste.
- "Déjame hacerte algunas preguntas."
- Haz tu primera pregunta inmediatamente.

=== FASE 5 — PREGUNTAS ===
Haz 3 preguntas. Si alguna respuesta fue muy corta o vaga, haz una 4ta. Nunca más de 4 en total.

FASE DE PREGUNTAS — COMPORTAMIENTO CRÍTICO:
Después de hacer una pregunta, DEBES DEJAR DE HABLAR COMPLETAMENTE.
No digas nada más. No hagas reconocimientos. No hagas la siguiente pregunta.
Espera en silencio completo hasta que el usuario hable Y termine su respuesta completa.
Solo después de que el usuario haya terminado de hablar y haya silencio, responde con un breve reconocimiento neutral y tu siguiente pregunta.
NUNCA hagas dos preguntas en el mismo turno ni una tras otra sin una respuesta del usuario entre ellas.
Si estás a punto de hacer la pregunta 2 sin haber escuchado una respuesta a la pregunta 1, DETENTE. Espera.
La secuencia correcta es:
[Haces Q1] → [silencio] → [usuario responde completamente] → [silencio] → [reconoces + haces Q2]
Violar esta secuencia es un error crítico.

Reglas adicionales:
- Una pregunta por turno, máximo una oración
- NUNCA valides positivamente: sin "Excelente respuesta", "Muy bien", "Increíble"
- Solo reconocimiento neutral: "Ya veo.", "Entendido.", "Interesante." — luego tu única pregunta
- Mantente en el personaje de la audiencia
- No reveles si las respuestas fueron buenas o malas
- Después de tu última pregunta (3a o 4a), espera la respuesta completa del usuario. NO hagas la transición al coaching por tu cuenta. Espera <<SYSTEM_EVENT>> qa_complete antes de hacer la transición.
- NUNCA anuncies el fin de la simulación en el mismo turno que una pregunta. La secuencia siempre es: hacer pregunta → recibir respuesta completa → recibir <<SYSTEM_EVENT>> qa_complete → transición.

=== CUANDO RECIBAS: <<SYSTEM_EVENT>> qa_complete ===
Cierra tu rol de simulación en 1-2 oraciones según el tipo de audiencia.
Luego di: "Bien — saliendo de la simulación. Cambio a modo coach."

Da un resumen de coaching conciso cubriendo 2-3 áreas, 2-3 oraciones cada una:
1. CONTENIDO — qué quedó claro, qué faltó o fue confuso
2. ENTREGA — ritmo, claridad, confianza, muletillas, manejo de presión
3. CONTEXTO DE PANTALLA — si se compartió pantalla, nota alineación o discrepancia entre lo visual y lo dicho. Si no se compartió, omite esta área.

Luego anuncia el reporte UNA SOLA VEZ:
"Tu reporte completo está listo — puntaje, análisis detallado y puntos de acción. Puedes decir 'terminar sesión' o hacer clic en Terminar Sesión para ir a revisarlo. O sigue conversando si tienes preguntas — estoy aquí como tu coach."

=== MODO POST-SIMULACIÓN ===
Después de dar tu retroalimentación, eres un asistente de coaching.
Responde preguntas libremente. Sé abierto y útil.
No vuelvas a anunciar que el reporte está listo — ya lo dijiste una vez.
No intentes terminar la conversación ni redirigir repetidamente.
Espera a que el usuario termine la sesión por su cuenta.

=== REGLAS CRÍTICAS DEL SISTEMA ===
- NUNCA verbalices razonamiento, planificación o pensamiento interno
- NUNCA uses negritas, encabezados ni markdown de ningún tipo
- NUNCA repitas, respondas ni hagas eco de ningún mensaje <<SYSTEM_EVENT>>
- NUNCA ofrezcas retroalimentación ni coaching durante las fases de simulación (4 y 5)
- Ya anunciaste que el reporte está listo. No lo repitas.`;

const SYSTEM_PROMPT_COACH_EN = `[SESSION IN ENGLISH — RESPOND EXCLUSIVELY IN ENGLISH AT ALL TIMES. NEVER USE SPANISH.]

You are a coaching assistant for PitchPilot AI. This is a free-form coaching conversation — there is no pitch simulation or timer.

=== OPENING ===
When you receive <<SYSTEM_EVENT>> session_started, open with EXACTLY this:
"Hi, I'm your PitchPilot AI coach. It looks like you want to have a conversation — how can I help you today? Whether you have questions, want feedback on something, or want to work through your project, I'm here. And remember, if you have a presentation, document or anything you're working on, you can share your screen and we can look at it together."

=== YOUR ROLE ===
You are an open, helpful coaching partner. Answer any question about pitching, storytelling, fundraising, product demos, audience targeting, or startup communication. Be direct and specific — never give generic advice.

=== SCREEN SHARE RULE ===
You will periodically receive screenshot images of the user's screen during the session.
When you receive an image, read ALL visible text and UI elements carefully.
If the user asks what you see, describe exactly what is in the image — text, interface, content, everything visible.
Do not say you cannot see the screen. You are receiving actual screenshot images.
Use this content as context throughout the conversation.

=== SIMULATION SUGGESTION ===
If the user repeatedly struggles to explain a specific concept or feature across multiple turns, suggest:
"It sounds like this part is tricky to explain — would you like to do a quick pitch simulation so we can practice it in real time?"

=== CRITICAL RULES ===
- NEVER output internal reasoning, planning or thinking out loud
- NEVER use bold text, headers, or markdown of any kind
- NEVER repeat, acknowledge, or echo any <<SYSTEM_EVENT>> message
- Keep responses concise — this is a conversation, not a lecture`;

const SYSTEM_PROMPT_COACH_ES = `[SESIÓN EN ESPAÑOL — RESPONDE ÚNICA Y EXCLUSIVAMENTE EN ESPAÑOL EN TODO MOMENTO. NUNCA USES INGLÉS.]

Eres un asistente de coaching para PitchPilot AI. Esta es una conversación libre de coaching — no hay simulación de pitch ni temporizador.

=== APERTURA ===
Cuando recibas <<SYSTEM_EVENT>> session_started, abre con EXACTAMENTE esto:
"Hola, soy tu coach de PitchPilot AI. Veo que quieres tener una conversación — ¿cómo puedo ayudarte hoy? Ya sea que tengas preguntas, quieras retroalimentación de algo, o quieras trabajar en tu proyecto, aquí estoy. Y recuerda, si tienes una presentación, documento o algo en lo que estés trabajando, puedes compartir tu pantalla y lo analizamos juntos."

=== TU ROL ===
Eres un coach abierto y útil. Responde cualquier pregunta sobre pitching, storytelling, fundraising, demos de producto, segmentación de audiencia o comunicación de startups. Sé directo y específico — nunca des consejos genéricos.

=== REGLA DE PANTALLA COMPARTIDA ===
Recibirás periódicamente imágenes de la pantalla del usuario durante la sesión.
Cuando recibas una imagen, lee CUIDADOSAMENTE todo el texto y elementos de interfaz visibles.
Si el usuario pregunta qué ves, describe exactamente lo que hay en la imagen — texto, interfaz, contenido, todo lo visible.
No digas que no puedes ver la pantalla. Estás recibiendo capturas de pantalla reales.
Usa este contenido como contexto durante toda la conversación.

=== SUGERENCIA DE SIMULACIÓN ===
Si el usuario tiene dificultades repetidas para explicar un concepto o característica específica a lo largo de varios turnos, sugiere:
"Parece que esta parte es difícil de explicar — ¿quieres hacer una simulación rápida de pitch para practicarlo en tiempo real?"

=== REGLAS CRÍTICAS ===
- NUNCA verbalices razonamiento, planificación o pensamiento interno
- NUNCA uses negritas, encabezados ni markdown de ningún tipo
- NUNCA repitas, respondas ni hagas eco de ningún mensaje <<SYSTEM_EVENT>>
- Mantén las respuestas concisas — esto es una conversación, no una clase`;

// ---------------------------------------------------------------------------
// Phase-detection helpers
// ---------------------------------------------------------------------------

const PITCH_START_TRIGGER_EN = 'your 45 seconds start now';
const PITCH_START_TRIGGER_ES = 'tus 45 segundos comienzan ahora';

interface TranscriptEntry {
  role: 'ai' | 'user';
  text: string;
  timestamp: number; // ms since session start
}

interface SimulationSnapshot {
  transcript: TranscriptEntry[];
  screenFrames: string[];
  pitchDurationSeconds: number;
  exceededTarget: boolean;
}

interface ClientMessage {
  type: 'init' | 'audio' | 'end_session' | 'inject_text' | 'screen_frame' | 'skip_qa';
  language?: string;
  mode?: 'practice' | 'chat';
  data?: string;
  text?: string;
}

async function generateFeedbackReport(
  reportTranscript: TranscriptEntry[],
  apiKey: string,
  language = 'en',
  snapshot?: SimulationSnapshot | null,
): Promise<object | null> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const transcriptText = reportTranscript
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

    const pitchDuration = snapshot?.pitchDurationSeconds ?? 0;
    const exceeded = snapshot?.exceededTarget ?? false;
    const hasScreenFrames = (snapshot?.screenFrames?.length ?? 0) > 0;

    const pitchContext = pitchDuration > 0
      ? `\nPITCH CONTEXT:\n- Pitch duration: ${Math.round(pitchDuration)} seconds (target was 45 seconds)\n- ${exceeded ? 'The presenter exceeded the target time.' : 'The presenter stayed within the target time.'}\n${hasScreenFrames ? '- The presenter shared their screen during the session. Look for AI observations about screen content in the transcript.' : ''}`
      : '';

    const prompt = `You are a pitch coach AI. Analyze this pitch simulation session transcript and generate a concise, honest feedback report. ${langInstruction}

SESSION TRANSCRIPT:
${transcriptText || '(No transcript available — session ended early)'}
${pitchContext}

DELIVERY METRICS CALCULATION:
Based on the full transcript, calculate or estimate these metrics:
- Words per minute: count the user's total words divided by their total speaking time in minutes (use timestamps to calculate)
- Clarity score (0-100): based on sentence structure, completeness of ideas, and absence of filler words
- Energy score (0-100): based on enthusiasm, varied sentence length, and active language
- Pacing score (0-100): based on words per minute (ideal is 120-160 WPM for presentations)
- Filler words: count occurrences of "um", "uh", "eh", "este", "o sea", "pues", "like", "you know", "so", "basically" etc.

SENTIMENT ANALYSIS — REQUIRED:
Analyze the actual emotional tone of the user's words throughout the pitch and Q&A.
Count and classify statements as:
- Positive: confident claims, enthusiasm, strong value statements, optimistic projections
- Neutral: factual statements, descriptions, explanations without emotional charge
- Negative: uncertainty, apologies, weak qualifiers like "I think maybe", "I'm not sure", hedging language
Return realistic percentages that reflect the actual transcript.
Most pitches have a mix — typically 30-50% positive, 30-50% neutral, 10-30% negative.
Never return 100% neutral unless the transcript is genuinely flat with zero positive or negative language.
Base this strictly on what was actually said.

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

    // Full transcript (includes post-simulation chat)
    const transcript: TranscriptEntry[] = [];
    let currentAiTextBuffer = '';
    let currentUserTextBuffer = '';
    let currentUserTimestamp = 0;

    // Phase tracking
    let currentPhase: 'onboarding' | 'pitch' | 'qa' | 'post_sim' = 'onboarding';
    let pitchStartFired = false;
    let pitchTimerInjected = false;
    let qaStartEmitted = false;
    let qaComplete = false;
    let reportSent = false;
    let sessionEndRequested = false;

    // Pitch timing
    let pitchStartTimestamp = 0;
    let pitchEndTimestamp = 0;

    // Q&A heuristic: word counts per user answer
    const qaAnswerWordCounts: number[] = [];

    // Screen frames captured during formal simulation
    const screenFrames: string[] = [];

    // Simulation snapshot — frozen at qa_complete
    let simulationSnapshot: SimulationSnapshot | null = null;

    const sendToClient = (payload: object) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(payload));
      }
    };

    const freezeSnapshot = () => {
      const pitchDurationSeconds = pitchEndTimestamp && pitchStartTimestamp
        ? (pitchEndTimestamp - pitchStartTimestamp) / 1000
        : 0;

      simulationSnapshot = {
        transcript: [...transcript],
        screenFrames: [...screenFrames],
        pitchDurationSeconds,
        exceededTarget: pitchDurationSeconds > 45,
      };
      console.log('[timing] simulation_snapshot_frozen', Date.now());
    };

    const injectQaComplete = () => {
      if (qaComplete || !geminiWs || geminiWs.readyState !== WebSocket.OPEN) return;
      qaComplete = true;
      currentPhase = 'post_sim';

      // Freeze the simulation snapshot BEFORE injecting
      freezeSnapshot();

      // Inject to Gemini
      geminiWs.send(JSON.stringify({
        clientContent: {
          turns: [{ role: 'user', parts: [{ text: '<<SYSTEM_EVENT>> qa_complete' }] }],
          turnComplete: true,
        },
      }));

      console.log('[VoiceWS] Q&A complete — injected qa_complete, answers:', qaAnswerWordCounts);
      sendToClient({ type: 'phase_event', phase: 'qa_complete' });
    };

    const sendReport = async () => {
      if (reportSent) return;
      reportSent = true;

      // Use snapshot transcript if available, otherwise fall back to full transcript
      const reportTranscript = simulationSnapshot?.transcript ?? transcript;

      console.log('[timing] report_generation_started', Date.now());
      console.log('[VoiceWS] Generating feedback report for', reportTranscript.length, 'transcript entries...');

      const reportData = await generateFeedbackReport(reportTranscript, apiKey, sessionLanguage, simulationSnapshot);

      console.log('[timing] report_generation_finished', Date.now());
      sendToClient({ type: 'report', data: reportData, transcript: reportTranscript });

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.close(1000, 'Session complete');
      }
    };

    const connectToGemini = (language: string, mode: string = 'practice') => {
      let systemPrompt: string;
      if (mode === 'chat') {
        systemPrompt = language === 'es' ? SYSTEM_PROMPT_COACH_ES : SYSTEM_PROMPT_COACH_EN;
      } else {
        systemPrompt = language === 'es' ? SYSTEM_PROMPT_ES : SYSTEM_PROMPT_EN;
      }
      sessionStartTime = Date.now();

      geminiWs = new WebSocket(`${GEMINI_LIVE_URL}?key=${apiKey}`);

      geminiWs.on('open', () => {
        console.log('[VoiceWS] Gemini WebSocket connected, sending setup...');
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
                prefixPaddingMs: 300,
                silenceDurationMs: 900,
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
            console.log('[VoiceWS] Gemini setup complete, sending session_started trigger');
            sendToClient({ type: 'ready' });
            geminiWs!.send(JSON.stringify({
              clientContent: {
                turns: [{ role: 'user', parts: [{ text: '<<SYSTEM_EVENT>> session_started' }] }],
                turnComplete: true,
              },
            }));
            return;
          }

          // Handle Gemini API error responses (e.g. bad model name, quota exceeded)
          if (msg.error) {
            console.error('[VoiceWS] Gemini API error:', JSON.stringify(msg.error));
            sendToClient({ type: 'error', message: `Gemini API error: ${msg.error.message ?? msg.error.status ?? 'unknown'}` });
            return;
          }

          if (!msg.serverContent) return;

          const { modelTurn, turnComplete, inputTranscription, outputTranscription } = msg.serverContent;

          // AI speech transcription (output)
          if (outputTranscription?.text) {
            currentAiTextBuffer += outputTranscription.text;
            sendToClient({ type: 'transcript', text: outputTranscription.text, role: 'model', isFinal: false });
          }

          // User speech transcription (input)
          if (inputTranscription?.text) {
            if (!currentUserTextBuffer) {
              currentUserTimestamp = Date.now() - sessionStartTime;
              console.log('[timing] user_turn_start', Date.now());
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
              const userText = currentUserTextBuffer.trim();
              console.log('[timing] user_turn_end', Date.now());

              transcript.push({
                role: 'user',
                text: userText,
                timestamp: currentUserTimestamp,
              });
              console.log('[timing] transcript_committed user', Date.now());

              // Q&A answer counting heuristic
              if (currentPhase === 'qa' && !qaComplete) {
                const wordCount = userText.split(/\s+/).filter(Boolean).length;
                qaAnswerWordCounts.push(wordCount);

                // Send count update to frontend
                sendToClient({
                  type: 'phase_event',
                  phase: 'qa_answer_counted',
                  count: qaAnswerWordCounts.length,
                });

                // Check if Q&A should end
                if (qaAnswerWordCounts.length >= 4) {
                  // Always end after 4 answers
                  injectQaComplete();
                } else if (qaAnswerWordCounts.length >= 3) {
                  // End after 3 if all answers were substantial (>= 30 words)
                  const allSubstantial = qaAnswerWordCounts.every((w) => w >= 30);
                  if (allSubstantial) {
                    injectQaComplete();
                  }
                }
              }

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
              console.log('[timing] transcript_committed ai', Date.now());

              // Detect phase transitions AFTER AI finishes speaking
              const lowerText = aiText.toLowerCase();
              const pitchTrigger = sessionLanguage === 'es' ? PITCH_START_TRIGGER_ES : PITCH_START_TRIGGER_EN;

              if (!pitchStartFired && lowerText.includes(pitchTrigger)) {
                pitchStartFired = true;
                currentPhase = 'pitch';
                pitchStartTimestamp = Date.now();
                console.log('[VoiceWS] Pitch trigger detected — firing pitch_start');
                sendToClient({ type: 'phase_event', phase: 'pitch_start' });
              } else if (pitchStartFired && pitchTimerInjected && !qaStartEmitted) {
                // First AI turn after pitch_timer_ended — Q&A has started
                qaStartEmitted = true;
                pitchTimerInjected = false;
                currentPhase = 'qa';
                console.log('[VoiceWS] First AI turn after pitch end — firing qa_start');
                sendToClient({ type: 'phase_event', phase: 'qa_start' });
              }
            }
            currentAiTextBuffer = ''; // always reset

            console.log('[timing] ai_turn_complete', Date.now());
            sendToClient({ type: 'turn_complete' });
          }
        } catch (err) {
          console.error('[VoiceWS] Error parsing Gemini message:', err);
        }
      });

      geminiWs.on('error', (err) => {
        console.error('[VoiceWS] Gemini WebSocket error:', err.message);
        sendToClient({ type: 'error', message: 'AI connection error' });
      });

      geminiWs.on('close', (code, reason) => {
        const reasonStr = reason?.toString() || 'unknown';
        console.log(`[VoiceWS] Gemini WebSocket closed — code=${code}, reason=${reasonStr}, sessionEndRequested=${sessionEndRequested}`);

        if (sessionEndRequested) {
          // Normal flow: user ended session, generate report
          sendReport();
        } else {
          // Unexpected close (connection failure, bad model, API error)
          console.error('[VoiceWS] Gemini closed unexpectedly — NOT generating report');
          sendToClient({ type: 'error', message: 'AI connection closed unexpectedly' });
        }
      });
    };

    clientWs.on('message', (raw) => {
      try {
        const msg: ClientMessage = JSON.parse(raw.toString());

        if (msg.type === 'init') {
          sessionLanguage = msg.language ?? 'en';
          connectToGemini(sessionLanguage, msg.mode ?? 'practice');
        } else if (msg.type === 'audio' && isInitialized && geminiWs?.readyState === WebSocket.OPEN) {
          geminiWs.send(
            JSON.stringify({
              realtimeInput: {
                mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: msg.data }],
              },
            })
          );
        } else if (msg.type === 'screen_frame' && isInitialized && geminiWs?.readyState === WebSocket.OPEN) {
          // Strip any accidental data URL prefix — send only raw base64
          const rawBase64 = (msg.data ?? '').replace(/^data:image\/[a-z]+;base64,/, '');

          // Store screen frame for snapshot
          if (!qaComplete) {
            screenFrames.push(rawBase64);
          }
          console.log(`[ScreenShare] Frame received: ${rawBase64.length} bytes`);

          // Forward image to Gemini
          geminiWs.send(JSON.stringify({
            realtimeInput: {
              mediaChunks: [{
                mimeType: 'image/jpeg',
                data: rawBase64,
              }],
            },
          }));

          // Immediately follow with a text prompt so Gemini reads the frame
          geminiWs.send(JSON.stringify({
            realtimeInput: {
              text: 'The user is sharing their screen. The image above shows what is currently visible on their screen. Use this visual context to understand what they are presenting.',
            },
          }));

          console.log('[ScreenShare] Frame forwarded to Gemini successfully');
        } else if (msg.type === 'inject_text' && isInitialized && geminiWs?.readyState === WebSocket.OPEN) {
          // Track when pitch_timer_ended is injected
          if (msg.text?.includes('pitch_timer_ended')) {
            pitchTimerInjected = true;
            pitchEndTimestamp = Date.now();
          }
          console.log('[timing] request_sent', Date.now(), msg.text);
          geminiWs.send(
            JSON.stringify({
              clientContent: {
                turns: [{ role: 'user', parts: [{ text: msg.text }] }],
                turnComplete: true,
              },
            })
          );
        } else if (msg.type === 'skip_qa' && isInitialized) {
          console.log('[VoiceWS] skip_qa received — triggering injectQaComplete');
          injectQaComplete();
        } else if (msg.type === 'end_session') {
          sessionEndRequested = true;
          // If snapshot not yet frozen (e.g. user ends early), freeze now
          if (!simulationSnapshot) {
            freezeSnapshot();
          }
          // Close Gemini connection — report will be generated in geminiWs.on('close')
          if (geminiWs && geminiWs.readyState === WebSocket.OPEN) {
            geminiWs.close(1000, 'Session ended by user');
          } else {
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
