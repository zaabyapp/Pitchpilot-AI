import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useVoiceSession } from '../hooks/useVoiceSession';

const PITCH_DURATION = 45;   // seconds
const QA_DURATION = 300;     // 5 minutes in seconds
const QA_WARNING_AT = 20;    // seconds remaining when warning kicks in
const GRACE_PERIOD = 15;     // seconds after QA timer before hard inject
const COACH_REDIRECT_DELAY = 45000; // ms to wait after coaching starts before redirect

// Finite states for the simulation
// onboarding → pitch_intro → pitch_active → qa_active → qa_warning → coaching → done
const PHASE = {
  ONBOARDING: 'onboarding',
  PITCH_INTRO: 'pitch_intro',   // AI finished onboarding, timer frozen — waiting to start
  PITCH_ACTIVE: 'pitch_active',
  QA_ACTIVE: 'qa_active',
  QA_WARNING: 'qa_warning',
  COACHING: 'coaching',
  DONE: 'done',
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PitchRecorder({ language, sessionId, onSessionEnd }) {
  const [simPhase, setSimPhase] = useState(PHASE.ONBOARDING);
  const [pitchTimeLeft, setPitchTimeLeft] = useState(PITCH_DURATION);
  const [qaTimeLeft, setQaTimeLeft] = useState(QA_DURATION);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);

  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const pitchTimerRef = useRef(null);
  const qaTimerRef = useRef(null);
  const graceTimerRef = useRef(null);
  const coachRedirectRef = useRef(null);
  const simPhaseRef = useRef(simPhase);
  const questionsAnsweredRef = useRef(questionsAnswered);
  const injectTextRef = useRef(null);
  const startPitchCountdownRef = useRef(null);

  // Keep refs in sync for use inside callbacks
  simPhaseRef.current = simPhase;
  questionsAnsweredRef.current = questionsAnswered;

  // ---------------------------------------------------------------------------
  // Event handler from the voice session
  // ---------------------------------------------------------------------------

  const handleEvent = useCallback((event) => {
    if (event.type === 'phase_event' && event.phase === 'pitch_start') {
      startPitchCountdownRef.current?.();
    } else if (event.type === 'report') {
      // Report received — do full WS cleanup then navigate
      disconnectRef.current?.();
      onSessionEnd({
        report: event.data,
        transcript: event.transcript || [],
        sessionId,
        language,
        questionsAnswered: questionsAnsweredRef.current,
        endedAt: new Date().toISOString(),
      });
    }
  }, [onSessionEnd, sessionId, language]);

  const { status, isAISpeaking, micStream, transcript, connect, disconnect, injectText, requestReport } =
    useVoiceSession({ onEvent: handleEvent });

  // Keep disconnect + injectText in refs so handleEvent can call them without stale closure issues
  const disconnectRef = useRef(disconnect);
  disconnectRef.current = disconnect;
  injectTextRef.current = injectText;

  // Track user responses during Q&A to count questions answered
  useEffect(() => {
    if (simPhase === PHASE.QA_ACTIVE || simPhase === PHASE.QA_WARNING) {
      const userEntries = transcript.filter((e) => e.role === 'user' && e.isFinal);
      setQuestionsAnswered(userEntries.length);
    }
  }, [transcript, simPhase]);

  // ---------------------------------------------------------------------------
  // Pitch timer: start countdown
  // ---------------------------------------------------------------------------

  const startPitchCountdown = useCallback(() => {
    // Guard: only start if we haven't passed the pitch phase yet
    const phase = simPhaseRef.current;
    if (phase === PHASE.PITCH_ACTIVE || phase === PHASE.QA_ACTIVE ||
        phase === PHASE.QA_WARNING || phase === PHASE.COACHING || phase === PHASE.DONE) return;

    clearInterval(pitchTimerRef.current);
    setSimPhase(PHASE.PITCH_ACTIVE);
    let timeLeft = PITCH_DURATION;
    setPitchTimeLeft(timeLeft);
    pitchTimerRef.current = setInterval(() => {
      timeLeft -= 1;
      console.log('[PitchTimer] tick:', timeLeft);
      setPitchTimeLeft(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(pitchTimerRef.current);
        injectTextRef.current?.('<<SYSTEM_EVENT>> pitch_timer_ended');
        setSimPhase(PHASE.QA_ACTIVE);
      }
    }, 1000);
  }, []);

  // Keep startPitchCountdown in a ref so handleEvent (defined earlier) can call it
  startPitchCountdownRef.current = startPitchCountdown;

  // Transition ONBOARDING → PITCH_INTRO after 3 final AI turns
  useEffect(() => {
    if (simPhase !== PHASE.ONBOARDING) return;
    const finalAiTurns = transcript.filter((e) => e.role === 'ai' && e.isFinal).length;
    if (finalAiTurns >= 3) {
      setSimPhase(PHASE.PITCH_INTRO);
    }
  }, [transcript, simPhase]);

  // ---------------------------------------------------------------------------
  // Camera + voice session init
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const cam = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
        });
        if (cancelled) { cam.getTracks().forEach(t => t.stop()); return; }
        cameraStreamRef.current = cam;
        if (videoRef.current) videoRef.current.srcObject = cam;
      } catch (err) {
        console.warn('Camera not available:', err);
      }

      if (!cancelled) await connect({ language });
    };

    init();

    return () => {
      cancelled = true;
      clearAllTimers();
      disconnectRef.current?.();
      cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearAllTimers = () => {
    clearInterval(pitchTimerRef.current);
    clearInterval(qaTimerRef.current);
    clearTimeout(graceTimerRef.current);
    clearTimeout(coachRedirectRef.current);
  };

  // ---------------------------------------------------------------------------
  // Q&A timer (5 min)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (simPhase !== PHASE.QA_ACTIVE && simPhase !== PHASE.QA_WARNING) return;

    qaTimerRef.current = setInterval(() => {
      setQaTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(qaTimerRef.current);
          // Grace period before hard interrupt
          graceTimerRef.current = setTimeout(() => {
            if (simPhaseRef.current !== PHASE.COACHING && simPhaseRef.current !== PHASE.DONE) {
              injectText('<<SYSTEM_EVENT>> qa_timer_ended');
              setSimPhase(PHASE.COACHING);
            }
          }, GRACE_PERIOD * 1000);
          return 0;
        }
        if (prev === QA_WARNING_AT) {
          setSimPhase(PHASE.QA_WARNING);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(qaTimerRef.current);
  }, [simPhase, injectText]);

  // ---------------------------------------------------------------------------
  // Coaching phase → auto redirect
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (simPhase !== PHASE.COACHING) return;

    coachRedirectRef.current = setTimeout(() => {
      handleEndSession();
    }, COACH_REDIRECT_DELAY);

    return () => clearTimeout(coachRedirectRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simPhase]);

  // ---------------------------------------------------------------------------
  // Session actions
  // ---------------------------------------------------------------------------

  const handleEndSession = useCallback(() => {
    clearAllTimers();
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    setSimPhase(PHASE.DONE);
    // Send end_session + stop mic/audio, keep WS open to receive report
    requestReport();
  }, [requestReport]);

  const toggleMute = () => {
    micStream.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(prev => !prev);
  };

  const toggleVideo = () => {
    cameraStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsVideoOff(prev => !prev);
  };

  // ---------------------------------------------------------------------------
  // Derived UI state
  // ---------------------------------------------------------------------------

  const isConnecting = status === 'connecting';
  const isActive = status === 'active';
  const hasError = status === 'error';

  const statusLabel = isConnecting
    ? (language === 'es' ? 'Conectando…' : 'Connecting…')
    : hasError
    ? (language === 'es' ? 'Error de conexión' : 'Connection error')
    : isAISpeaking
    ? (language === 'es' ? 'AI hablando' : 'AI speaking')
    : isActive
    ? (language === 'es' ? 'Escuchando…' : 'Listening…')
    : (language === 'es' ? 'Desconectado' : 'Disconnected');

  const phaseLabel = {
    [PHASE.ONBOARDING]: language === 'es' ? 'Preparación' : 'Onboarding',
    [PHASE.PITCH_INTRO]: language === 'es' ? 'Listo para pitchear' : 'Ready to Pitch',
    [PHASE.PITCH_ACTIVE]: language === 'es' ? 'Tu Pitch — 45s' : 'Your Pitch — 45s',
    [PHASE.QA_ACTIVE]: language === 'es' ? 'Sesión de Preguntas' : 'Q&A Session',
    [PHASE.QA_WARNING]: language === 'es' ? '¡Tiempo casi agotado!' : 'Time almost up!',
    [PHASE.COACHING]: language === 'es' ? 'Feedback del Coach' : 'Coach Feedback',
    [PHASE.DONE]: language === 'es' ? 'Sesión finalizada' : 'Session ended',
  }[simPhase];

  // Timer display config
  const showPitchTimerFrozen = simPhase === PHASE.PITCH_INTRO;
  const showPitchTimer = simPhase === PHASE.PITCH_ACTIVE;
  const showQaTimer = simPhase === PHASE.QA_ACTIVE || simPhase === PHASE.QA_WARNING;
  const isWarning = simPhase === PHASE.QA_WARNING || (showPitchTimer && pitchTimeLeft <= 10);

  const timerColor = isWarning
    ? 'text-red-400 border-red-400/40 bg-red-500/10'
    : showPitchTimer || showPitchTimerFrozen
    ? 'text-orange-400 border-orange-400/40 bg-orange-500/10'
    : 'text-[#7c5cff] border-[#7c5cff]/40 bg-[#7c5cff]/10';

  const timerValue = showPitchTimerFrozen
    ? formatTime(PITCH_DURATION)
    : showPitchTimer
    ? formatTime(pitchTimeLeft)
    : showQaTimer
    ? formatTime(qaTimeLeft)
    : null;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  // Loading screen while backend generates the report
  if (simPhase === PHASE.DONE) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0a0812] text-slate-100 gap-8">
        <div className="relative size-20 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-[#7c5cff]/20 animate-ping" />
          <div className="size-16 rounded-full flex items-center justify-center bg-[#7c5cff]/10 border-2 border-[#7c5cff]">
            <span className="material-symbols-outlined text-[#7c5cff] text-2xl">auto_awesome</span>
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white">Generating your report…</h2>
          <p className="text-slate-400 text-sm">Analyzing your pitch with AI. This takes a few seconds.</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="size-2 rounded-full bg-[#7c5cff]/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#0a0812] text-slate-100 overflow-hidden">

      {/* Phase + Timer Header */}
      <header className="flex flex-col items-center pt-6 pb-3 relative z-10 gap-3">

        {/* Session badge */}
        <div className="bg-[#7c5cff]/10 border border-[#7c5cff]/20 px-4 py-1.5 rounded-full flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${hasError ? 'bg-red-500' : 'bg-[#7c5cff]'} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${hasError ? 'bg-red-500' : 'bg-[#7c5cff]'}`} />
          </span>
          <span className="text-[#7c5cff] text-[10px] font-bold uppercase tracking-[0.15em]">
            PitchPilot AI — {phaseLabel}
          </span>
        </div>

        {/* Timer display */}
        {timerValue && (
          <div className={`flex items-center gap-3 border rounded-xl px-5 py-2 ${timerColor} ${isWarning ? 'animate-pulse' : ''}`}>
            <span className="material-symbols-outlined text-base">timer</span>
            <span className="text-2xl font-black tabular-nums tracking-tight">{timerValue}</span>
            <span className="text-[10px] font-bold uppercase opacity-70">
              {showPitchTimer || showPitchTimerFrozen
                ? 'Pitch'
                : (language === 'es' ? 'Q&A' : 'Q&A')}
            </span>
          </div>
        )}

        {/* Coaching mode banner */}
        {simPhase === PHASE.COACHING && (
          <div className="flex items-center gap-2 border border-emerald-400/30 bg-emerald-400/10 rounded-xl px-5 py-2 text-emerald-400">
            <span className="material-symbols-outlined text-base">psychology</span>
            <span className="text-xs font-bold uppercase tracking-wider">
              {language === 'es' ? 'Modo Coach — Redirigiendo en ~45s' : 'Coach Mode — Redirecting in ~45s'}
            </span>
          </div>
        )}

      </header>

      {/* Main — video + AI panel */}
      <main className="flex-1 flex gap-4 px-6 overflow-hidden">

        {/* Self video preview */}
        <div className="relative w-1/2 aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-[#1a1a24] flex items-center justify-center">
              <span className="material-symbols-outlined text-6xl text-slate-600">videocam_off</span>
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-white/70">person</span>
            <span className="text-xs font-medium text-white/90">You</span>
          </div>
          {isMuted && (
            <div className="absolute top-4 left-4 bg-red-500/20 border border-red-500/40 px-3 py-1 rounded-lg">
              <span className="text-[10px] font-bold uppercase text-red-400">Muted</span>
            </div>
          )}
          {/* Pitch active indicator on video */}
          {(simPhase === PHASE.PITCH_INTRO || simPhase === PHASE.PITCH_ACTIVE) && (
            <div className="absolute top-4 right-4 bg-orange-500/20 border border-orange-400/40 px-3 py-1 rounded-lg flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-400" />
              </span>
              <span className="text-[10px] font-bold uppercase text-orange-400">Pitching</span>
            </div>
          )}
        </div>

        {/* AI status panel */}
        <div className="w-1/2 flex flex-col bg-[#1a1a24]/80 rounded-2xl border border-white/10 overflow-hidden">

          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">

            {/* AI avatar */}
            <div className="relative size-24 flex items-center justify-center">
              {isAISpeaking && (
                <span className="absolute inset-0 rounded-full bg-[#7c5cff]/20 animate-ping" />
              )}
              <div className={`size-20 rounded-full flex flex-col items-center justify-center border-2 transition-colors duration-300 ${
                isAISpeaking
                  ? 'border-[#7c5cff] bg-[#7c5cff]/10'
                  : isConnecting
                  ? 'border-slate-600 bg-white/5'
                  : simPhase === PHASE.COACHING
                  ? 'border-emerald-400 bg-emerald-400/10'
                  : 'border-white/10 bg-white/5'
              }`}>
                <span className={`material-symbols-outlined text-2xl ${simPhase === PHASE.COACHING ? 'text-emerald-400' : 'text-[#7c5cff]'}`}>
                  {isAISpeaking
                    ? 'record_voice_over'
                    : isConnecting
                    ? 'hourglass_empty'
                    : simPhase === PHASE.COACHING
                    ? 'psychology'
                    : 'mic'}
                </span>
                <span className="text-[8px] font-bold uppercase text-slate-400 tracking-widest mt-1 text-center leading-tight px-1">
                  {statusLabel}
                </span>
              </div>
            </div>

            {/* Waveform */}
            <div className="flex items-end gap-1 h-12">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-150 ${
                    isAISpeaking
                      ? simPhase === PHASE.COACHING ? 'bg-emerald-400' : 'bg-[#7c5cff]'
                      : 'bg-white/10'
                  }`}
                  style={{
                    height: isAISpeaking ? `${20 + Math.sin(Date.now() / 200 + i * 0.8) * 24 + 24}%` : '15%',
                    animation: isAISpeaking ? `bounce ${0.4 + (i % 3) * 0.15}s ease-in-out infinite alternate` : 'none',
                  }}
                />
              ))}
            </div>

            <div className="text-center space-y-2 max-w-xs">
              <p className="text-slate-300 text-sm font-medium">
                {simPhase === PHASE.ONBOARDING && (
                  isAISpeaking
                    ? (language === 'es' ? 'El AI está hablando…' : 'AI is speaking…')
                    : isConnecting
                    ? (language === 'es' ? 'Iniciando sesión…' : 'Starting session…')
                    : (language === 'es' ? 'Responde las preguntas de preparación' : 'Answer the onboarding questions')
                )}
                {simPhase === PHASE.PITCH_INTRO && (
                  isAISpeaking
                    ? (language === 'es' ? 'El AI está hablando…' : 'AI is speaking…')
                    : (language === 'es' ? 'El temporizador iniciará automáticamente…' : 'Timer will start automatically…')
                )}
                {simPhase === PHASE.PITCH_ACTIVE && (
                  isAISpeaking
                    ? (language === 'es' ? 'El AI está hablando…' : 'AI is speaking…')
                    : (language === 'es' ? 'Da tu pitch ahora — el temporizador corre' : 'Give your pitch now — timer is running')
                )}
                {(simPhase === PHASE.QA_ACTIVE) && (
                  isAISpeaking
                    ? (language === 'es' ? 'El AI está preguntando…' : 'AI is asking…')
                    : (language === 'es' ? 'Responde la pregunta' : 'Answer the question')
                )}
                {simPhase === PHASE.QA_WARNING && (
                  <span className="text-red-400 font-bold">
                    {language === 'es' ? '¡Menos de 20 segundos!' : 'Less than 20 seconds left!'}
                  </span>
                )}
                {simPhase === PHASE.COACHING && (
                  language === 'es' ? 'El coach está dando tu resumen…' : 'Your coach is giving live feedback…'
                )}
              </p>

              {/* Q&A question counter */}
              {(simPhase === PHASE.QA_ACTIVE || simPhase === PHASE.QA_WARNING) && questionsAnswered > 0 && (
                <p className="text-slate-500 text-xs">
                  {language === 'es'
                    ? `${questionsAnswered} respuesta${questionsAnswered > 1 ? 's' : ''} dada${questionsAnswered > 1 ? 's' : ''}`
                    : `${questionsAnswered} answer${questionsAnswered > 1 ? 's' : ''} given`}
                </p>
              )}

              <p className="text-slate-600 text-xs uppercase tracking-widest">
                {language === 'es'
                  ? 'Sesión de voz en tiempo real • Gemini Live'
                  : 'Real-time voice session • Gemini Live'}
              </p>
            </div>

            {/* Manual start-timer button — visible in PITCH_INTRO phase */}
            {simPhase === PHASE.PITCH_INTRO && !isAISpeaking && (
              <button
                onClick={startPitchCountdown}
                className="flex items-center gap-2 bg-orange-500/10 border border-orange-400/40 text-orange-400 hover:bg-orange-500 hover:text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200"
              >
                <span className="material-symbols-outlined text-base">timer</span>
                {language === 'es' ? 'Iniciar temporizador' : 'Start Timer'}
              </button>
            )}

            {isActive && !isMuted && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
                <span className="material-symbols-outlined text-base text-[#7c5cff]">mic</span>
                <span className="text-xs text-slate-400">
                  {language === 'es' ? 'Micrófono activo' : 'Microphone active'}
                </span>
              </div>
            )}

            {hasError && (
              <button
                onClick={() => connect({ language })}
                className="bg-[#7c5cff] hover:bg-[#7c5cff]/90 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all"
              >
                {language === 'es' ? 'Reintentar' : 'Retry connection'}
              </button>
            )}
          </div>

          <div className="p-4 border-t border-white/5 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest">
              {language === 'es'
                ? 'El AI conduce la sesión completa por voz'
                : 'AI conducts the full session by voice'}
            </p>
          </div>
        </div>
      </main>

      {/* Footer controls */}
      <footer className="p-6 flex items-center justify-center">
        <div className="bg-[#1a1a24]/80 backdrop-blur-2xl border border-white/10 p-2 rounded-2xl flex items-center gap-2 shadow-2xl">
          <button
            onClick={toggleMute}
            disabled={!isActive}
            className={`flex flex-col items-center justify-center size-14 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-30 ${
              isMuted ? 'text-red-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">{isMuted ? 'mic_off' : 'mic'}</span>
            <span className="text-[9px] font-bold uppercase mt-1">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          <button
            onClick={toggleVideo}
            className={`flex flex-col items-center justify-center size-14 rounded-xl hover:bg-white/5 transition-colors ${
              isVideoOff ? 'text-red-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">{isVideoOff ? 'videocam_off' : 'videocam'}</span>
            <span className="text-[9px] font-bold uppercase mt-1">{isVideoOff ? 'Cam On' : 'Cam Off'}</span>
          </button>

          <div className="w-px h-8 bg-white/10 mx-2" />

          <button
            onClick={handleEndSession}
            className="flex items-center gap-3 px-6 h-14 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300"
          >
            <span className="material-symbols-outlined">call_end</span>
            <span className="font-bold text-sm uppercase tracking-wide">
              {language === 'es' ? 'Terminar' : 'End Session'}
            </span>
          </button>
        </div>
      </footer>

      <div className="pb-4 text-center">
        <p className="text-[9px] text-slate-600 uppercase tracking-[0.3em]">
          Voice Mode • Gemini 2.5 Flash Native Audio • Charon
        </p>
      </div>
    </div>
  );
}
