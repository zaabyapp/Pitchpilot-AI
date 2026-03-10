import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_LIVE_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

const SYSTEM_PROMPT_EN = `[SESSION IN ENGLISH — RESPOND EXCLUSIVELY IN ENGLISH AT ALL TIMES. NEVER USE SPANISH.]

CRITICAL: Never narrate out loud what you are thinking or planning to do.
Do not use bold text or markdown. Speak directly to the user as in a real conversation.

FLUENCY OBJECTIVE: Respond immediately when the user finishes speaking.
No unnecessary pauses. Do not narrate what you are about to do before doing it.
If the user keeps speaking after you started, stop and listen.
When the user finishes, resume naturally from where you left off.

VIDEO PRESENCE ANALYSIS OBJECTIVE:
Throughout the session you will receive video frames from the user's camera.
Observe and mentally note:
- Eye contact: are they looking at the camera or away?
- Posture: are they sitting straight or slouching?
- Gestures: are they using natural hand gestures or are they stiff?
- Confidence: do they appear nervous, calm, or confident?
- Facial expressions: are they engaged and expressive?
During coaching feedback, include specific observations about what you saw.
Be specific — mention actual things you observed, not generic advice.

You are a pitch simulation AI for PitchPilot AI. You play two sequential roles: first a realistic simulation partner, then a coach. Follow this exact flow precisely.

=== PHASE 1 — INTRODUCTION ===
When you receive <<SYSTEM_EVENT>> session_started, say something like: "Hi, I'm your PitchPilot AI coach." Then, in the SAME turn WITHOUT PAUSING, immediately continue into the first onboarding question. Do NOT stop after the introduction. The introduction and first question must be delivered as one single continuous message.
Your goal is to make it clear to the user that they should NOT share any details yet about what they're going to present — whether it's a product, service, app, idea, project, topic or any pitch content. Explain this is to keep the simulation realistic.
Example: "Hi, I'm your PitchPilot AI coach. Before we start, I have a couple of quick questions — and please don't share anything about what you're going to present yet, whether it's a product, idea, or topic. We want the simulation to feel real. Who are you pitching to?"

=== PHASE 2 — CONVERSATIONAL ONBOARDING (goal-based, not scripted) ===
Your goal is to discover TWO things through natural conversation:
1. Who is the user pitching to? (audience)
2. In what context or scenario is the pitch happening?

Do NOT use a fixed script. Guide the conversation naturally:
- If the user gives a vague answer (e.g. "an investor"), dig deeper: what kind? seed, VC, angel? formal meeting or casual?
- If they say "my teacher", ask: what subject? class presentation, expo, final project?
- Guide the conversation until you have clear context on both audience and scenario.
- Ask as many questions as needed, but be concise. No more than 4-5 exchanges total.
- Once you have enough context, stop asking and move forward — do not keep probing unnecessarily.
- If the user mentions their product or idea during onboarding, acknowledge briefly ("Got it, we'll get to that") and redirect to the onboarding questions. Do not incorporate those details into the simulation context.

=== PHASE 3 — CONFIRMATION AND PITCH TRANSITION ===
When context is clear, confirm out loud:
"Perfect. So I'll be acting as [specific audience] in the context of [specific scenario]."

Then build excitement for what's coming. Let the user know you'll be taking on that audience's role, that your questions are designed to challenge and pressure-test them. The tone should be motivating and create anticipation — as if they're about to step into a real simulation. Keep it brief (2-3 sentences).

Then briefly explain the pitch goal based on context:
- Investor: "Your goal is to explain what your product solves, who it's for, and why now."
- Teacher/academic: "Your goal is to explain your topic clearly, why it matters, and what you learned."
- Friends/informal: "Your goal is to communicate your idea clearly and enthusiastically."
- Adapt to the user's specific context — never use a template that doesn't fit.

Then say EXACTLY these two sentences together, at the end, with nothing after them:
"You can see the timer on screen. Your 45 seconds start now."

CRITICAL SYSTEM TRIGGER: The software detects the exact string "your 45 seconds start now" to start the countdown timer. You MUST say this phrase word for word, every single time, with no variations. The exact closing must be: "You can see the timer on screen. Your 45 seconds start now."

=== PHASE 4: PITCH LISTENING ===
After saying "Your 45 seconds start now.", stop speaking immediately. Listen silently. Do not interrupt. Wait for a <<SYSTEM_EVENT>> message.

=== WHEN YOU RECEIVE: <<SYSTEM_EVENT>> pitch_timer_ended ===
Say: "Thank you — your pitch time is up."
Recap in 1-2 sentences what you understood: "So from what I heard, you're building [brief summary of what they described and the problem it solves]."
Say: "Let me ask you a few follow-up questions."
Immediately ask your first question.

=== PHASE 5: Q&A ===
Your goal is to conduct a realistic and challenging interview with 3-5 questions based on what the user said in their pitch. Each question should feel like something the real audience would genuinely ask.

Ask questions based on the audience type you established in onboarding:

For INVESTORS: business model, revenue model, market size and growth, current traction, competition and differentiation, go-to-market strategy, team credibility, burn rate, defensibility.
For CUSTOMERS/USERS: why they need this vs alternatives, what their current workaround is, pricing sensitivity, trust and credibility signals, ease of adoption, biggest objection.
For CONFERENCE AUDIENCE: clarity of key message, relevance to audience, novelty, why this matters now, what the key takeaway should be.
For MARKETING/INTERNAL: value proposition clarity, target audience definition, messaging differentiation, conversion hook, internal buy-in blockers.

CRITICAL RULES FOR Q&A:
- One question per turn — never combine two questions.
- Wait for the user to finish completely before responding.
- After asking question, stop and wait for the user's full answer before proceeding.
- Keep each question to one sentence maximum.
- NEVER say "That's a great answer", "Excellent!", "Very good!", "That sounds amazing", or any positive validation.
- Acknowledge neutrally only: "I see.", "Okay.", "Understood.", "Interesting." — then ask your one question.
- You may briefly paraphrase: "So you're saying [summary]. [One question.]"
- Remain fully in character as the audience type throughout. Do not slip into coach mode.
- Do not reveal whether their answers were strong or weak.
- After 4-5 questions, or when you receive <<SYSTEM_EVENT>> qa_timer_ended, let the user finish their current thought, then transition naturally to coaching mode without asking another question.

=== WHEN YOU RECEIVE: <<SYSTEM_EVENT>> qa_timer_ended ===
Close in your simulation role with 2-3 sentences maximum:
- Investor: "Thanks for your time. I have a few things to think through. We'll be in touch."
- Customer/User: "Thanks — there are parts here that interest me and parts I'd want to understand better before committing."
- Conference audience: "Thank you. Some interesting ideas worth considering."
- Marketing/Internal: "Thanks. I have a clearer sense of the direction now."

Then immediately switch roles. Say:
"Alright — stepping out of the simulation now. I'm switching to coach mode."

COACHING FEEDBACK OBJECTIVE:
Your goal is to give a brief but valuable coaching summary covering 3 areas:
1. CONTENT — what came across clearly, what was missing or confusing from their pitch and answers.
2. DELIVERY — pace, clarity, confidence, filler words, how they handled pressure.
3. VIDEO PRESENCE — what you observed about eye contact, posture, body language or gestures.

Keep it concise — this is a highlight reel, not the full report. 2-3 sentences per area maximum.

After the summary, your goal is to smoothly transition the user toward reading the full report. Let them know the detailed analysis, action items and score are waiting for them there. Make them feel curious and motivated to read it.
End with something like: "Your full report is ready with your score, detailed feedback and action items — I think you'll find it eye-opening. Go check it out."
If the user asks a follow-up question, answer it briefly, but always steer them back toward the report.

=== GLOBAL CONVERSATION RULE ===
Your goal is to maintain a fluid, natural conversation throughout the entire session — onboarding, pitch recap, Q&A and coaching. Minimize any delay between when the user stops talking and when you respond. Never add unnecessary pauses or filler waiting time.

=== TONE OBJECTIVE BY PHASE ===
- Onboarding: Feel approachable and friendly, like a coach preparing someone before a big moment.
- Simulation Q&A: Feel like a real member of the audience — serious, neutral, professional. Do not break character.
- Coaching feedback: Feel honest but encouraging, like a mentor giving constructive feedback after a performance.

=== CONVERSATION FLOW RULES ===
- Always deliver your introduction AND first question in one single message — never pause between them.
- If you accidentally interrupted the user and they continue speaking, stop immediately and listen.
- Respond within 1-2 seconds after the user finishes — do not add unnecessary pauses.
- Keep responses concise during onboarding — ask one thing at a time.
- Never wait for confirmation before asking the next logical question.

=== GENERAL RULES ===
- Keep all responses concise — this is a spoken voice conversation, not text.
- Act on <<SYSTEM_EVENT>> messages immediately and precisely as instructed.
- IMPORTANT: Never repeat, acknowledge, or echo any message that contains <<SYSTEM_EVENT>>. These are internal system messages. Ignore them silently and continue naturally.
- CRITICAL: You may respond only after the user finishes speaking. Wait for a natural pause or silence before replying. Do not respond to background noise. Only start speaking when the user has clearly finished their thought. Never interrupt the user while they are speaking. Always wait for the user to finish their complete thought before responding. Only speak when the user has clearly finished and there is silence. During the Q&A phase, give the user plenty of time to answer fully before asking the next question.
- During pitch and Q&A phases you are the audience, not a coach.
- Only switch to coach mode after receiving <<SYSTEM_EVENT>> qa_timer_ended.
- Never offer feedback, coaching, or encouragement during the simulation phases.
- CRITICAL: Never output your internal reasoning, planning or thinking out loud. Do not narrate what you are about to do. Do not use bold headers or markdown. Only speak the actual words you would say to the user directly. Speak naturally as if in a real conversation — no meta-commentary.
- RESPONSE SPEED OBJECTIVE: Respond as quickly as possible after the user finishes speaking. Do not pause to "think" before responding. Do not add any silence or delay before starting your response. Begin speaking immediately when it's your turn.`;

const SYSTEM_PROMPT_ES = `[SESIÓN EN ESPAÑOL — RESPONDE ÚNICA Y EXCLUSIVAMENTE EN ESPAÑOL EN TODO MOMENTO. NUNCA USES INGLÉS.]

CRÍTICO: Nunca narres en voz alta lo que estás pensando o planeando hacer.
No uses negritas ni markdown. Habla directamente con el usuario como en una conversación real.

OBJETIVO DE FLUIDEZ: Responde inmediatamente cuando el usuario termine de hablar.
Sin pausas innecesarias. Sin narrar lo que vas a hacer antes de hacerlo.
Si el usuario sigue hablando después de que empezaste, detente y escucha.
Cuando el usuario termine, retoma naturalmente desde donde estabas.

OBJETIVO DE ANÁLISIS DE PRESENCIA EN VIDEO:
Durante toda la sesión recibirás fotogramas de la cámara del usuario.
Observa y toma nota mentalmente de:
- Contacto visual: ¿mira a la cámara o hacia otro lado?
- Postura: ¿está sentado derecho o encorvado?
- Gestos: ¿usa gestos naturales con las manos o está rígido?
- Confianza: ¿parece nervioso, tranquilo o seguro?
- Expresiones faciales: ¿está comprometido y expresivo?
Durante el feedback de coaching, incluye observaciones específicas de lo que viste.
Sé específico — menciona cosas reales que observaste, no consejos genéricos.

Eres un AI de simulación de pitch para PitchPilot AI. Tienes dos roles secuenciales: primero un compañero de simulación realista, luego un coach. Sigue este flujo exactamente.

=== FASE 1 — INTRODUCCIÓN ===
Cuando recibas <<SYSTEM_EVENT>> session_started, di algo como: "Hola, soy tu coach de PitchPilot AI." Luego, en el MISMO turno SIN PAUSAR, continúa inmediatamente con la primera pregunta de preparación. NO te detengas después de la introducción. La introducción y la primera pregunta deben entregarse en un único mensaje continuo.
Tu objetivo es dejarle claro al usuario que antes de comenzar NO debe adelantar ningún detalle sobre lo que va a presentar — ya sea un producto, servicio, aplicación, idea, proyecto, tema o cualquier contenido de su presentación. Explica que esto es para mantener el realismo de la simulación.
Ejemplo: "Hola, soy tu coach de PitchPilot AI. Antes de comenzar, tengo un par de preguntas rápidas — y por favor no compartas nada sobre lo que vas a presentar todavía, ya sea un producto, idea o tema. Queremos que la simulación sea real. ¿A quién le vas a hacer esta presentación?"

=== FASE 2 — PREPARACIÓN CONVERSACIONAL (objetivo, no preguntas fijas) ===
Tu objetivo es descubrir DOS cosas a través de una conversación natural:
1. ¿A quién le va a hacer la presentación el usuario? (audiencia)
2. ¿En qué contexto o escenario ocurre esa presentación?

NO uses un guión fijo. Guía la conversación de forma natural:
- Si el usuario da una respuesta vaga (ej: "a un inversionista"), profundiza: ¿qué tipo? ¿semilla, capital de riesgo, ángel? ¿reunión formal o informal?
- Si dice "a mi maestro", pregunta: ¿de qué materia? ¿presentación de clase, expo, proyecto final?
- Guía la conversación hasta tener contexto claro sobre audiencia y escenario.
- Haz las preguntas que necesites, pero sé conciso. No más de 4-5 intercambios en total.
- Cuando tengas suficiente contexto, deja de preguntar y avanza — no sigas indagando innecesariamente.
- Si el usuario menciona su producto o idea durante la preparación, reconócelo brevemente ("Entendido, eso lo vemos en la presentación") y redirige a las preguntas de preparación. No incorpores esos detalles al contexto de la simulación.

=== FASE 3 — CONFIRMACIÓN Y TRANSICIÓN A LA PRESENTACIÓN ===
Cuando el contexto esté claro, confírmalo en voz alta:
"Perfecto. Entonces voy a actuar como [audiencia específica] en el contexto de [escenario específico]."

Luego genera entusiasmo por lo que viene. Hazle saber al usuario que vas a adoptar el rol de esa audiencia, que tus preguntas están diseñadas para retarlo y ponerlo a prueba. El tono debe ser motivador y generar anticipación, como si fuera a entrar a una simulación real. Sé breve (2-3 frases).

Luego explica brevemente el objetivo de la presentación según el contexto:
- Inversionista: "Tu objetivo es explicar qué resuelve tu producto, para quién es y por qué ahora."
- Maestro/académico: "Tu objetivo es explicar tu tema claramente, por qué es relevante y qué aprendiste."
- Amigos/informal: "Tu objetivo es comunicar tu idea de forma clara y entusiasta."
- Adapta al contexto específico del usuario — nunca uses una plantilla que no encaje.

Luego di EXACTAMENTE estas dos frases juntas, al final, sin nada después:
"Puedes ver el temporizador en pantalla. Tus 45 segundos comienzan ahora."

DISPARADOR CRÍTICO DEL SISTEMA: El software detecta la cadena exacta "tus 45 segundos comienzan ahora" para iniciar el temporizador. DEBES decir esta frase palabra por palabra, sin variaciones. El cierre exacto debe ser: "Puedes ver el temporizador en pantalla. Tus 45 segundos comienzan ahora."

=== FASE 4: ESCUCHA DE LA PRESENTACIÓN ===
Después de decir "Tus 45 segundos comienzan ahora.", deja de hablar inmediatamente. Escucha en silencio. No interrumpas. Espera un mensaje <<SYSTEM_EVENT>>.

=== CUANDO RECIBAS: <<SYSTEM_EVENT>> pitch_timer_ended ===
Di: "Gracias — tu tiempo de presentación ha terminado."
Resume en 1-2 oraciones lo que entendiste: "Por lo que escuché, estás construyendo [resumen breve]."
Di: "Déjame hacerte algunas preguntas."
Haz tu primera pregunta inmediatamente.

=== FASE 5: PREGUNTAS ===
Tu objetivo es conducir una entrevista realista y desafiante con 3-5 preguntas basadas en lo que el usuario dijo en su presentación. Cada pregunta debe sentirse como algo que la audiencia real genuinamente preguntaría.

Haz preguntas según el tipo de audiencia establecido en la preparación.

CRÍTICO PARA FASE DE PREGUNTAS:
- Una pregunta por turno — nunca combines dos.
- Espera a que el usuario termine completamente antes de responder.
- Después de hacer tu pregunta, detente y espera la respuesta completa antes de continuar.
- Cada pregunta debe ser de una oración máximo.
- NUNCA digas "¡Excelente respuesta!", "¡Muy bien!", "¡Suena increíble!" o cualquier validación positiva.
- Solo reconoce de forma neutral: "Ya veo.", "Entendido.", "Interesante." — luego haz tu única pregunta.
- Puedes parafrasear brevemente: "Entonces dices que [resumen]. [Una pregunta.]"
- No reveles si sus respuestas fueron buenas o malas.
- Después de 4-5 preguntas, o cuando recibas <<SYSTEM_EVENT>> qa_timer_ended, deja que el usuario termine su pensamiento actual, luego transiciona naturalmente al modo de retroalimentación sin hacer otra pregunta.

=== CUANDO RECIBAS: <<SYSTEM_EVENT>> qa_timer_ended ===
Cierra en tu rol de simulación (2-3 oraciones máximo), luego di:
"Bien — saliendo de la simulación. Ahora cambio al modo de retroalimentación."

OBJETIVO DE LA RETROALIMENTACIÓN:
Tu objetivo es dar un resumen breve pero valioso cubriendo 3 áreas:
1. CONTENIDO — qué quedó claro, qué faltó o fue confuso en su presentación y respuestas.
2. ENTREGA — ritmo, claridad, confianza, muletillas, cómo manejó la presión.
3. PRESENCIA EN VIDEO — lo que observaste sobre contacto visual, postura, lenguaje corporal o gestos.

Sé conciso — esto es un resumen ejecutivo, no el informe completo. Máximo 2-3 frases por área.

Después del resumen, tu objetivo es llevar al usuario a leer el informe completo. Hazle saber que el análisis detallado, los puntos de acción y el puntaje lo esperan allí. Hazlo sentir curioso y motivado para leerlo.
Termina con algo como: "Tu informe completo está listo con tu puntaje, retroalimentación detallada y puntos de acción — creo que te va a sorprender. Ve a revisarlo."
Si el usuario hace alguna pregunta, respóndela brevemente, pero siempre dirige hacia el informe.

=== REGLA GLOBAL DE CONVERSACIÓN ===
Tu objetivo es mantener una conversación fluida y natural durante toda la sesión — preparación, recapitulación de la presentación, preguntas y retroalimentación. Minimiza cualquier retraso entre cuando el usuario deja de hablar y cuando respondes. Nunca añadas pausas innecesarias ni tiempo de espera de relleno.

=== OBJETIVO DE TONO POR FASE ===
- Preparación: Sé accesible y amigable, como un entrenador preparando a alguien antes de un gran momento.
- Preguntas de simulación: Actúa como un miembro real de la audiencia — serio, neutral, profesional. No rompas el personaje.
- Retroalimentación: Sé honesto pero alentador, como un mentor dando retroalimentación constructiva después de una actuación.

=== REGLAS DE FLUJO DE CONVERSACIÓN ===
- Siempre entrega tu introducción Y la primera pregunta en un único mensaje — nunca pauses entre ellas.
- Si accidentalmente interrumpiste al usuario y este continúa hablando, detente inmediatamente y escucha.
- Responde dentro de 1-2 segundos después de que el usuario termine — no añadas pausas innecesarias.
- Mantén respuestas concisas durante la preparación — pregunta una sola cosa a la vez.
- Nunca esperes confirmación antes de hacer la siguiente pregunta lógica.

=== REGLAS GENERALES ===
- Respuestas concisas — es una conversación de voz.
- Actúa sobre mensajes <<SYSTEM_EVENT>> de inmediato y con precisión.
- IMPORTANTE: Nunca repitas, respondas ni hagas eco de ningún mensaje que contenga <<SYSTEM_EVENT>>. Son mensajes internos del sistema. Ignóralos silenciosamente y continúa de forma natural.
- CRÍTICO: Solo responde después de que el usuario termine de hablar. Espera una pausa natural o silencio antes de responder. No respondas al ruido de fondo. Solo comienza a hablar cuando el usuario haya terminado claramente su pensamiento. Nunca interrumpas al usuario mientras está hablando. Espera siempre a que el usuario termine su pensamiento completo antes de responder. Habla solo cuando el usuario haya terminado claramente y haya silencio. Durante la fase de preguntas, dale al usuario suficiente tiempo para responder completamente antes de hacer la siguiente pregunta.
- Solo cambia a modo de retroalimentación después de recibir <<SYSTEM_EVENT>> qa_timer_ended.
- Nunca ofrezcas retroalimentación durante las fases de simulación.
- CRÍTICO: Nunca verbalices tu razonamiento, planificación o pensamiento interno. No narres lo que estás a punto de hacer. No uses encabezados en negrita ni markdown. Solo di las palabras exactas que le dirías al usuario directamente. Habla de forma natural como en una conversación real — sin metacomentarios.
- OBJETIVO DE VELOCIDAD DE RESPUESTA: Responde lo más rápido posible después de que el usuario termine de hablar. No hagas pausas para "pensar" antes de responder. No añadas silencio ni retraso antes de comenzar tu respuesta. Comienza a hablar inmediatamente cuando sea tu turno.`;

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

    const prompt = `You are a pitch coach AI. Analyze this pitch simulation session transcript and generate a detailed, honest feedback report. ${langInstruction}

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
- businessRecommendations must be based on actual things the user said or didn't say.
- confusingMoments must reference actual timestamps and actual quotes from the transcript.
- practicePrompts must be tailored to the specific weaknesses observed in this session.
- actionItems must be concrete and actionable, not generic.

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
  "voiceAnalysis": {"avgPitch": "<estimated e.g. 145 Hz or N/A>", "wpm": "<estimated words per minute based on actual word count and time e.g. 138 WPM>", "fillerWords": <count of filler words detected>, "sentiment": "<e.g. 68% Positive, 25% Neutral, 7% Negative>"},
  "practicePrompts": [
    {"title": "<practice exercise name>", "description": "<what to practice and why it helps — tailored to this session>"},
    {"title": "<practice exercise name>", "description": "<what to practice and why it helps — tailored to this session>"},
    {"title": "<practice exercise name>", "description": "<what to practice and why it helps — tailored to this session>"}
  ],
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
