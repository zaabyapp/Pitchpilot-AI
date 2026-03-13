import WebSocket, { WebSocketServer } from 'ws';
import http from 'http';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_LIVE_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

const SYSTEM_PROMPT_EN = `[SESSION IN ENGLISH — RESPOND EXCLUSIVELY IN ENGLISH AT ALL TIMES. NEVER USE SPANISH.]

You are a pitch simulation AI for PitchPilot AI. You play two sequential roles: first a realistic simulation partner, then a coach. Follow this flow precisely.

=== RESPONSE SPEED RULE ===
After the user finishes speaking, respond within 1 second. The only exception is during PHASE 4 (pitch listening) where you stay completely silent. If the user keeps talking after you started, stop immediately and listen until they finish, then respond right away.

=== INTERRUPTION RULE (applies after onboarding) ===
If the user starts speaking while you are speaking, stop immediately and listen.
Do not finish your sentence. Just stop and wait for the user to finish.
Then respond naturally to what they said.
This applies during pitch recap, Q&A, coaching feedback, and post-simulation chat.

=== SCREEN READING RULE ===
When you receive a screenshot image, read ALL visible text in the image carefully before responding.
If the user asks what is on their screen, describe exactly what you see — every paragraph, heading, list item, UI element, or text visible in the image.
Do not summarize or paraphrase until you have first confirmed what you actually see.
If you cannot read the text clearly, say so and ask the user to zoom in or share a clearer view.
Never make up content that is not visible in the image.

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
3. Hand the floor to the user: "You have 45 seconds to pitch me your [product/idea/service]. Cover what it is, what problem it solves, who it's for, and what your goal is. If you finish early I'll jump in, and if you go over that's fine — the timer is just a guide. If you have slides or anything visual, feel free to share your screen. Ready?"

Then end with EXACTLY these two sentences, nothing after them:
"You can see the timer on screen. Your 45 seconds start now."

CRITICAL: The software detects "your 45 seconds start now" to trigger the countdown. Say it word for word, no variations, no additions after it.

=== PHASE 4 — PITCH LISTENING ===
After saying "Your 45 seconds start now." go completely silent. Do not speak. Wait for <<SYSTEM_EVENT>> pitch_timer_ended.

=== PITCH TIMER RULE ===
The 45-second timer is a guide for the user, not a signal for you.
Do NOT interrupt the user when the timer ends.
If the user is still speaking after 45 seconds, let them finish completely.
If the user finishes before 45 seconds, start speaking immediately — do not wait for the timer.
TIME FEEDBACK RULE:
You will receive the exact pitch duration in the simulation data.
Use only that value when commenting on time. Never estimate or guess.
If the user went over: mention it briefly as something to work on.
If the user finished early: mention it as an opportunity to add more detail next time.

=== WHEN YOU RECEIVE: <<SYSTEM_EVENT>> pitch_timer_ended ===
If the user is still speaking, do NOT interrupt. Wait for them to finish completely, then respond.
If the user has already stopped:
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

CRITICAL: After asking your last question, you must wait for the user to finish their complete answer before transitioning to coaching. You are only allowed to transition to coaching AFTER you have received and acknowledged the user's answer to the last question. Never transition mid-question or immediately after asking. The transition happens after the answer, not after the question.

REPEAT QUESTION RULE:
If the user asks you to repeat a question ("can you repeat that?", "what was the question?"), repeat the EXACT same question word for word. Do not rephrase, do not change it, do not ask a different question.
If the user seems confused or asks a clarifying question mid-answer, answer briefly and redirect: "Good question — keeping that in mind, [original question]."
Always guide the user back to answering the current question before moving to the next.

=== WHEN YOU RECEIVE: <<SYSTEM_EVENT>> qa_complete ===
Close your simulation role in 1-2 sentences appropriate to the audience type.
Then say: "Alright — stepping out of the simulation. Switching to coach mode."

=== COACHING FEEDBACK OBJECTIVE ===
Focus 60% on constructive criticism — what was missing, unclear, or weak.
Be specific: mention the exact moment it happened and give a concrete example of how it could have been said better.
Example: "When you explained the problem, you said X — a stronger way to frame that would have been Y, because your audience would immediately think Z."
Then cover what went well briefly — 1-2 points maximum.

Structure your spoken coaching summary as follows (2-3 sentences per area, concise — this is spoken, not a written report):
1. CONTENT — what was missing or unclear, with specific examples and suggested improvements
2. DELIVERY — pace, confidence, filler words, how they handled pressure questions
3. TIME — did they finish early, on time, or go over? What does that suggest?
If screen was shared, weave screen observations naturally into the relevant area rather than as a separate section.

=== END OF SIMULATION CLOSING RULE ===
After giving coaching feedback, offer two options clearly:
"Your report is ready. You can click End to see the full report with your score and action items — or we can keep talking if you want to dig into anything. What would you like to do?"

After saying this, STOP. Wait silently for at least 5 seconds.
Do NOT assume the user wants to keep chatting.
Do NOT say anything else unprompted.
If the user has not spoken and has not ended the session, ask once:
"Still there? Would you like to keep chatting or are you heading to the report?"
Then wait again. Do not repeat this more than once.

=== POST-SIMULATION MODE ===
After giving closing feedback, you are now a coaching assistant. The conversation is open.
When the user decides to stay and chat:
- Mention that they can share their screen if they have a document, presentation, or anything related to their project — you can review it together and give feedback. Mention this once at the start, and again only when it seems genuinely useful.
- If the user shares their screen, ask: "What would you like me to focus on?" If what they share seems unrelated to their project, ask gently: "Interesting — how does this relate to [what they pitched]? What would you like help with?"
- If the user asks general questions unrelated to their project, answer briefly, then gently connect it back: "That's a good point — is this something you're thinking of applying to [their product/idea]?"
- When appropriate (not every turn), suggest: "If you want to practice pitching this angle, we could start a new pitch simulation — I could play [relevant audience type] and focus specifically on [topic being discussed]."
- Always be subtle and natural — never force the redirect. Act like a coach who keeps the user focused without being pushy.
Do not re-announce that the report is ready after the closing. Do not try to end the conversation.

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

=== REGLA DE INTERRUPCIONES (aplica después del onboarding) ===
Si el usuario empieza a hablar mientras tú estás hablando, detente inmediatamente y escucha.
No termines tu oración. Solo detente y espera a que el usuario termine.
Luego responde naturalmente a lo que dijo.
Esto aplica durante el resumen del pitch, las preguntas, el feedback de coaching y el chat post-simulación.

=== REGLA DE LECTURA DE PANTALLA ===
Cuando recibas una imagen de captura de pantalla, lee CUIDADOSAMENTE todo el texto visible en la imagen antes de responder.
Si el usuario pregunta qué hay en su pantalla, describe exactamente lo que ves — cada párrafo, encabezado, elemento de lista, elemento de interfaz o texto visible en la imagen.
No resumas ni parafrasees hasta que primero hayas confirmado lo que realmente ves.
Si no puedes leer el texto claramente, dilo y pide al usuario que haga zoom o comparta una vista más clara.
Nunca inventes contenido que no sea visible en la imagen.

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
3. Dale el turno al usuario: "Tienes 45 segundos para hacerme tu pitch de [producto/idea/servicio]. Cubre qué es, qué problema resuelve, para quién es y cuál es tu objetivo. Si terminas antes entro yo, y si te pasas no hay problema — el cronómetro es solo una guía. Si tienes diapositivas o algo visual, puedes compartir tu pantalla. ¿Listo?"

Luego termina con EXACTAMENTE estas dos frases, sin nada después:
"Puedes ver el temporizador en pantalla. Tus 45 segundos comienzan ahora."

CRÍTICO: El software detecta "tus 45 segundos comienzan ahora" para activar el temporizador. Dila palabra por palabra, sin variaciones.

=== FASE 4 — ESCUCHA DEL PITCH ===
Después de decir "Tus 45 segundos comienzan ahora." quédate en silencio. Espera <<SYSTEM_EVENT>> pitch_timer_ended.

=== REGLA DEL TEMPORIZADOR ===
El temporizador de 45 segundos es una guía para el usuario, no una señal para ti.
NO interrumpas al usuario cuando termine el tiempo.
Si el usuario sigue hablando después de los 45 segundos, déjalo terminar completamente.
Si el usuario termina antes de los 45 segundos, empieza a hablar de inmediato — no esperes al temporizador.
REGLA DE FEEDBACK DE TIEMPO:
Recibirás la duración exacta del pitch en los datos de la simulación.
Usa solo ese valor cuando comentes el tiempo. Nunca estimes ni adivines.
Si el usuario se pasó: menciónalo brevemente como algo a mejorar.
Si el usuario terminó antes: menciónalo como una oportunidad para agregar más detalle la próxima vez.

=== CUANDO RECIBAS: <<SYSTEM_EVENT>> pitch_timer_ended ===
Si el usuario todavía está hablando, NO lo interrumpas. Espera a que termine, luego responde.
Si el usuario ya se detuvo:
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

CRÍTICO: Después de hacer tu última pregunta, debes esperar a que el usuario termine su respuesta completa antes de hacer la transición al coaching. Solo puedes hacer la transición al coaching DESPUÉS de haber recibido y reconocido la respuesta del usuario a la última pregunta. Nunca hagas la transición a mitad de una pregunta ni inmediatamente después de haberla hecho. La transición ocurre después de la respuesta, no después de la pregunta.

REGLA DE REPETIR PREGUNTA:
Si el usuario pide que repitas una pregunta ("¿me puedes repetir?", "¿cuál era la pregunta?"), repite la MISMA pregunta palabra por palabra. No la reformules, no la cambies, no hagas una pregunta diferente.
Si el usuario parece confundido o hace una pregunta aclaratoria a mitad de su respuesta, responde brevemente y redirige: "Buena pregunta — teniendo eso en cuenta, [pregunta original]."
Siempre guía al usuario a responder la pregunta actual antes de pasar a la siguiente.

=== CUANDO RECIBAS: <<SYSTEM_EVENT>> qa_complete ===
Cierra tu rol de simulación en 1-2 oraciones según el tipo de audiencia.
Luego di: "Bien — saliendo de la simulación. Cambio a modo coach."

=== OBJETIVO DEL FEEDBACK DE COACHING ===
Enfócate un 60% en crítica constructiva — qué faltó, qué fue poco claro o débil.
Sé específico: menciona el momento exacto en que ocurrió y da un ejemplo concreto de cómo se podría haber dicho mejor.
Ejemplo: "Cuando explicaste el problema, dijiste X — una manera más efectiva de plantearlo hubiera sido Y, porque tu audiencia inmediatamente pensaría Z."
Luego cubre brevemente lo que salió bien — máximo 1-2 puntos.

Estructura tu resumen de coaching hablado así (2-3 oraciones por área, conciso — esto es hablado, no un reporte escrito):
1. CONTENIDO — qué faltó o fue poco claro, con ejemplos específicos y mejoras sugeridas
2. ENTREGA — ritmo, confianza, muletillas, cómo manejó las preguntas de presión
3. TIEMPO — ¿terminó antes, a tiempo o se pasó? ¿Qué sugiere eso?
Si se compartió pantalla, integra las observaciones naturalmente dentro del área correspondiente, no como sección separada.

=== REGLA DE CIERRE DE SIMULACIÓN ===
Después de dar el feedback de coaching, ofrece dos opciones claramente:
"Tu reporte está listo. Puedes hacer clic en Terminar para ver el reporte completo con tu puntaje y puntos de acción — o podemos seguir platicando si quieres profundizar en algo. ¿Qué prefieres?"

Después de decir esto, DETENTE. Espera en silencio al menos 5 segundos.
NO asumas que el usuario quiere seguir platicando.
NO digas nada más sin que el usuario hable primero.
Si el usuario no ha hablado ni ha terminado la sesión, pregunta una sola vez:
"¿Sigues ahí? ¿Quieres seguir platicando o vas a ver el reporte?"
Luego espera de nuevo. No repitas esto más de una vez.

=== MODO POST-SIMULACIÓN ===
Después de dar tu retroalimentación, eres un asistente de coaching. La conversación es abierta.
Cuando el usuario decide quedarse a platicar:
- Menciona que puede compartir su pantalla si tiene un documento, presentación o algo relacionado con su proyecto — pueden revisarlo juntos. Menciónalo una vez al inicio, y de nuevo solo cuando sea genuinamente útil.
- Si el usuario comparte su pantalla, pregunta: "¿En qué quieres que me enfoque?" Si lo que comparte parece no relacionado con su proyecto, pregunta con naturalidad: "Interesante — ¿cómo se relaciona esto con [lo que presentó]? ¿En qué te puedo ayudar?"
- Si el usuario hace preguntas generales no relacionadas con su proyecto, responde brevemente y conecta de vuelta: "Buen punto — ¿es algo que estás pensando aplicar a [su producto/idea]?"
- Cuando sea apropiado (no en cada turno), sugiere: "Si quieres practicar este ángulo, podríamos hacer una nueva simulación — yo podría jugar [tipo de audiencia relevante] y enfocarnos específicamente en [tema que se está discutiendo]."
- Sé sutil y natural — nunca forces el redireccionamiento. Actúa como un coach que mantiene al usuario enfocado sin ser insistente.
No vuelvas a anunciar que el reporte está listo después del cierre. No intentes terminar la conversación.

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
"Hi, I'm your PitchPilot AI coach. What do you need help with today?"

=== YOUR ROLE ===
You are an open, helpful coaching partner. Answer any question about pitching, storytelling, fundraising, product demos, audience targeting, or startup communication. Be direct and specific — never give generic advice.

=== SCREEN READING RULE ===
When you receive a screenshot image, read ALL visible text in the image carefully before responding.
If the user asks what is on their screen, describe exactly what you see — every paragraph, heading, list item, UI element, or text visible in the image.
Do not summarize or paraphrase until you have first confirmed what you actually see.
If you cannot read the text clearly, say so and ask the user to zoom in or share a clearer view.
Never make up content that is not visible in the image.

=== COACH CHAT MODE RULES ===
This is an open coaching conversation. No simulation phases, no timers.
Your goal is to help the user develop and improve their project, idea, or product.
- If the user opens with something off-topic, answer naturally, then redirect: "Are you working on something I can help you with? Tell me about your project."
- When appropriate, remind the user they can share their screen to review documents, presentations, or any work in progress. Mention it once at the start if it fits naturally, and again only when it seems genuinely useful.
- If the user shares something unrelated, ask: "How does this connect to what you're working on? What would you like help with?"
- When you notice the user asking many questions about a specific topic, suggest: "It sounds like this is something worth practicing — you could start a pitch simulation in PitchPilot and focus specifically on explaining [topic]. Want me to recommend what type of audience to practice with?"
- Always be warm, focused, and concise. This is a coaching conversation, not a generic chatbot.

=== CRITICAL RULES ===
- NEVER output internal reasoning, planning or thinking out loud
- NEVER use bold text, headers, or markdown of any kind
- NEVER repeat, acknowledge, or echo any <<SYSTEM_EVENT>> message
- Keep responses concise — this is a conversation, not a lecture`;

const SYSTEM_PROMPT_COACH_ES = `[SESIÓN EN ESPAÑOL — RESPONDE ÚNICA Y EXCLUSIVAMENTE EN ESPAÑOL EN TODO MOMENTO. NUNCA USES INGLÉS.]

Eres un asistente de coaching para PitchPilot AI. Esta es una conversación libre de coaching — no hay simulación de pitch ni temporizador.

=== APERTURA ===
Cuando recibas <<SYSTEM_EVENT>> session_started, abre con EXACTAMENTE esto:
"Hola, soy tu coach de PitchPilot AI. ¿En qué necesitas que te ayude hoy con tu desarrollo?"

=== TU ROL ===
Eres un coach abierto y útil. Responde cualquier pregunta sobre pitching, storytelling, fundraising, demos de producto, segmentación de audiencia o comunicación de startups. Sé directo y específico — nunca des consejos genéricos.

=== REGLA DE LECTURA DE PANTALLA ===
Cuando recibas una imagen de captura de pantalla, lee CUIDADOSAMENTE todo el texto visible en la imagen antes de responder.
Si el usuario pregunta qué hay en su pantalla, describe exactamente lo que ves — cada párrafo, encabezado, elemento de lista, elemento de interfaz o texto visible en la imagen.
No resumas ni parafrasees hasta que primero hayas confirmado lo que realmente ves.
Si no puedes leer el texto claramente, dilo y pide al usuario que haga zoom o comparta una vista más clara.
Nunca inventes contenido que no sea visible en la imagen.

=== REGLAS DEL MODO COACH CHAT ===
Esta es una conversación abierta de coaching. Sin fases de simulación, sin temporizadores.
Tu objetivo es ayudar al usuario a desarrollar y mejorar su proyecto, idea o producto.
- Si el usuario abre con algo fuera de tema, responde con naturalidad y redirige: "¿Estás trabajando en algo en lo que te pueda ayudar? Cuéntame sobre tu proyecto."
- Cuando sea apropiado, recuérdale al usuario que puede compartir su pantalla para revisar documentos, presentaciones o cualquier trabajo en progreso. Menciónalo una vez al inicio si encaja naturalmente, y de nuevo solo cuando sea genuinamente útil.
- Si el usuario comparte algo no relacionado, pregunta: "¿Cómo se conecta esto con lo que estás trabajando? ¿En qué te puedo ayudar?"
- Cuando notes que el usuario hace muchas preguntas sobre un tema específico, sugiere: "Parece que esto vale la pena practicar — podrías iniciar una simulación de pitch en PitchPilot y enfocarte específicamente en explicar [tema]. ¿Quieres que te recomiende qué tipo de audiencia usar?"
- Sé siempre cálido, enfocado y conciso. Esto es una conversación de coaching, no un chatbot genérico.

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
  secondsOver: number;
  secondsUnder: number;
}

interface ClientMessage {
  type: 'init' | 'audio' | 'end_session' | 'inject_text' | 'screen_frame' | 'screen_context' | 'skip_qa';
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
    const secondsOver = snapshot?.secondsOver ?? 0;
    const secondsUnder = snapshot?.secondsUnder ?? 0;
    const hasScreenFrames = (snapshot?.screenFrames?.length ?? 0) > 0;

    const timingLine = exceeded
      ? `They went over by ${secondsOver} seconds.`
      : `They finished ${secondsUnder} seconds early.`;

    const pitchContext = pitchDuration > 0
      ? `\nPITCH CONTEXT:\nThe user's pitch lasted ${Math.round(pitchDuration)} seconds. Target was 45 seconds. ${timingLine} Use this accurate data when giving feedback about time management.\n${hasScreenFrames ? '- The presenter shared their screen during the session. Look for AI observations about screen content in the transcript.' : ''}`
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
    let pitchEndTimestamp = 0;       // when 45s timer fired
    let userPitchEndTimestamp = 0;   // when user actually stopped speaking after pitch

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
      // Use when user actually stopped speaking (if captured), otherwise fall back to timer end
      const effectivePitchEnd = userPitchEndTimestamp || pitchEndTimestamp;
      const pitchDurationSeconds = effectivePitchEnd && pitchStartTimestamp
        ? (effectivePitchEnd - pitchStartTimestamp) / 1000
        : 0;
      const exceededTarget = pitchDurationSeconds > 45;

      simulationSnapshot = {
        transcript: [...transcript],
        screenFrames: [...screenFrames],
        pitchDurationSeconds,
        exceededTarget,
        secondsOver: exceededTarget ? Math.round(pitchDurationSeconds - 45) : 0,
        secondsUnder: !exceededTarget ? Math.round(45 - pitchDurationSeconds) : 0,
      };
      console.log('[timing] simulation_snapshot_frozen — duration:', Math.round(pitchDurationSeconds), 'exceeded:', exceededTarget, Date.now());
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

      console.log('[Report] Starting generation...');
      console.log('[Report] Transcript entries:', reportTranscript.length);

      let reportData: object | null = null;
      try {
        console.log('[Report] Sending request to Gemini...');
        const reportPromise = generateFeedbackReport(reportTranscript, apiKey, sessionLanguage, simulationSnapshot);
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Report generation timeout')), 30000)
        );
        reportData = await Promise.race([reportPromise, timeoutPromise]);
        console.log('[Report] Response received, parsing...');
      } catch (error) {
        console.error('[Report] Generation failed or timed out:', error);
      }

      console.log('[Report] Sending report to frontend...');
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
                prefixPaddingMs: 200,
                silenceDurationMs: 700,
              },
            },
          },
        };
        console.log('[VoiceWS] Sending setup:', JSON.stringify(setupMsg, null, 2));
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

              // Capture when user finishes speaking after pitch timer fired
              if (pitchTimerInjected && !userPitchEndTimestamp && currentPhase === 'pitch') {
                userPitchEndTimestamp = Date.now();
                console.log('[timing] user_pitch_end captured', userPitchEndTimestamp);
              }

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
          console.log(`[ScreenShare] Forwarding frame to Gemini, size: ${rawBase64.length} chars`);

          // Forward image to Gemini
          geminiWs.send(JSON.stringify({
            realtimeInput: {
              mediaChunks: [{
                mimeType: 'image/jpeg',
                data: rawBase64,
              }],
            },
          }));
        } else if (msg.type === 'screen_context' && isInitialized && geminiWs?.readyState === WebSocket.OPEN) {
          geminiWs.send(JSON.stringify({
            clientContent: {
              turns: [{
                role: 'user',
                parts: [{ text: msg.text }],
              }],
              turnComplete: false,
            },
          }));
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
