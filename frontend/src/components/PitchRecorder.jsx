import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useVoiceSession } from '../hooks/useVoiceSession';
import { useScreenShare } from '../hooks/useScreenShare';

const PITCH_DURATION = 45; // seconds

// Finite states for the simulation
const PHASE = {
  ONBOARDING: 'onboarding',
  PITCH_INTRO: 'pitch_intro',
  PITCH_ACTIVE: 'pitch_active',
  QA_WAITING: 'qa_waiting',
  QA_ACTIVE: 'qa_active',
  COACHING: 'coaching',     // AI giving coaching feedback (one-time closing)
  POST_SIM: 'post_sim',    // Post-simulation coaching chat
  DONE: 'done',
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const TRANSLATIONS = {
  en: {
    connecting: 'Connecting…', error: 'Connection error', aiSpeaking: 'AI speaking',
    listening: 'Listening…', disconnected: 'Disconnected',
    onboarding: 'Onboarding', readyToPitch: 'Ready to Pitch', pitchPhase: 'Your Pitch — 45s',
    qaSession: 'Q&A Session', coachFeedback: 'Coach Feedback',
    coachAvailable: 'Coach Available', sessionEnded: 'Session ended',
    coachMode: 'Coach Mode', sharingScreen: 'Sharing screen',
    aiSpeakingMsg: 'AI is speaking…', startingSession: 'Starting session…',
    answerOnboarding: 'Answer the onboarding questions',
    timerWillStart: 'Timer will start automatically…',
    givePitch: 'Give your pitch now — timer is running',
    waitingQuestion: 'Waiting for first question…',
    aiAsking: 'AI is asking…', answerQuestion: 'Answer the question',
    coachSummary: 'Your coach is giving live feedback…',
    askAnything: 'Ask anything or end the session',
    answersGiven: (n) => `${n} answer${n !== 1 ? 's' : ''} given`,
    realtimeBadge: 'Real-time voice session • Gemini Live',
    startTimer: 'Start Timer',
    reportReady: 'Your report is ready. End the session when you want to review it.',
    endAndView: 'End Session & View Report',
    micActive: 'Microphone active',
    retry: 'Retry connection',
    aiConducts: 'AI conducts the full session by voice',
    mute: 'Mute', unmute: 'Unmute', camOff: 'Cam Off', camOn: 'Cam On',
    share: 'Share', stop: 'Stop',
    endSession: 'End Session',
    generatingReport: 'Generating your report…',
    analyzingPitch: 'Analyzing your pitch with AI. This takes a few seconds.',
    restartSession: 'Restart Session',
    skipToFeedback: 'Skip to Feedback',
    restartConfirm: 'Are you sure? Your current session data will be lost.',
    confirmYes: 'Yes, restart', confirmNo: 'Cancel',
  },
  es: {
    connecting: 'Conectando…', error: 'Error de conexión', aiSpeaking: 'IA hablando',
    listening: 'Escuchando…', disconnected: 'Desconectado',
    onboarding: 'Preparación', readyToPitch: 'Listo para pitchear', pitchPhase: 'Tu Pitch — 45s',
    qaSession: 'Sesión de Preguntas', coachFeedback: 'Feedback del Coach',
    coachAvailable: 'Coach disponible', sessionEnded: 'Sesión finalizada',
    coachMode: 'Modo Coach', sharingScreen: 'Compartiendo pantalla',
    aiSpeakingMsg: 'El AI está hablando…', startingSession: 'Iniciando sesión…',
    answerOnboarding: 'Responde las preguntas de preparación',
    timerWillStart: 'El temporizador iniciará automáticamente…',
    givePitch: 'Da tu pitch ahora — el temporizador corre',
    waitingQuestion: 'Esperando primera pregunta…',
    aiAsking: 'El AI está preguntando…', answerQuestion: 'Responde la pregunta',
    coachSummary: 'El coach está dando tu resumen…',
    askAnything: 'Pregunta lo que quieras o termina la sesión',
    answersGiven: (n) => `${n} respuesta${n !== 1 ? 's' : ''} dada${n !== 1 ? 's' : ''}`,
    realtimeBadge: 'Sesión de voz en tiempo real • Gemini Live',
    startTimer: 'Iniciar temporizador',
    reportReady: 'Tu reporte está listo. Termina la sesión cuando quieras revisarlo.',
    endAndView: 'Terminar y ver reporte',
    micActive: 'Micrófono activo',
    retry: 'Reintentar',
    aiConducts: 'El AI conduce la sesión completa por voz',
    mute: 'Silenciar', unmute: 'Activar', camOff: 'Cámara off', camOn: 'Cámara on',
    share: 'Compartir', stop: 'Detener',
    endSession: 'Terminar',
    generatingReport: 'Generando tu informe…',
    analyzingPitch: 'Analizando tu presentación con IA. Esto toma unos segundos.',
    restartSession: 'Reiniciar sesión',
    skipToFeedback: 'Pasar a retroalimentación',
    restartConfirm: '¿Estás seguro? Los datos de tu sesión actual se perderán.',
    confirmYes: 'Sí, reiniciar', confirmNo: 'Cancelar',
  },
};

export default function PitchRecorder({ language, sessionId, onSessionEnd, mode = 'practice', onReset }) {
  const t = TRANSLATIONS[language] ?? TRANSLATIONS.en;
  const isChat = mode === 'chat';

  const [simPhase, setSimPhase] = useState(isChat ? PHASE.POST_SIM : PHASE.ONBOARDING);
  const [pitchTimeLeft, setPitchTimeLeft] = useState(PITCH_DURATION);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [simulationClosingDone, setSimulationClosingDone] = useState(isChat);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const pitchTimerRef = useRef(null);
  const simPhaseRef = useRef(simPhase);
  const questionsAnsweredRef = useRef(questionsAnswered);
  const injectTextRef = useRef(null);
  const startPitchCountdownRef = useRef(null);
  const coachingStartIndexRef = useRef(-1);

  simPhaseRef.current = simPhase;
  questionsAnsweredRef.current = questionsAnswered;

  // Screen share
  const { isScreenSharing, screenStream, startScreenShare, stopScreenShare, captureFrame: captureScreenFrame, startPeriodicCapture, stopPeriodicCapture } = useScreenShare();
  const screenPreviewRef = useRef(null);

  // Bind screen stream to preview video element
  useEffect(() => {
    if (screenPreviewRef.current) {
      screenPreviewRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // ---------------------------------------------------------------------------
  // Event handler from the voice session
  // ---------------------------------------------------------------------------

  const handleEvent = useCallback((event) => {
    if (event.type === 'phase_event' && event.phase === 'pitch_start') {
      startPitchCountdownRef.current?.();
    } else if (event.type === 'phase_event' && event.phase === 'qa_start') {
      setSimPhase(PHASE.QA_ACTIVE);
    } else if (event.type === 'phase_event' && event.phase === 'qa_answer_counted') {
      setQuestionsAnswered(event.count ?? 0);
    } else if (event.type === 'phase_event' && event.phase === 'qa_complete') {
      // Transition to coaching — simulation closing
      setSimPhase(PHASE.COACHING);
    } else if (event.type === 'report') {
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

  const { status, isAISpeaking, isUserSpeaking, micStream, transcript, connect, disconnect, injectText, sendScreenFrame, requestReport, skipToFeedback } =
    useVoiceSession({ onEvent: handleEvent });

  const disconnectRef = useRef(disconnect);
  disconnectRef.current = disconnect;
  injectTextRef.current = injectText;

  // ---------------------------------------------------------------------------
  // Pitch timer
  // ---------------------------------------------------------------------------

  const startPitchCountdown = useCallback(() => {
    const phase = simPhaseRef.current;
    if (phase === PHASE.PITCH_ACTIVE || phase === PHASE.QA_WAITING ||
        phase === PHASE.QA_ACTIVE || phase === PHASE.COACHING ||
        phase === PHASE.POST_SIM || phase === PHASE.DONE) return;

    clearInterval(pitchTimerRef.current);
    setSimPhase(PHASE.PITCH_ACTIVE);
    let timeLeft = PITCH_DURATION;
    setPitchTimeLeft(timeLeft);

    // Capture one screen frame at pitch start
    if (isScreenSharing) {
      const frame = captureScreenFrame();
      if (frame) sendScreenFrame(frame);
    }

    pitchTimerRef.current = setInterval(() => {
      timeLeft -= 1;
      setPitchTimeLeft(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(pitchTimerRef.current);
        injectTextRef.current?.('<<SYSTEM_EVENT>> pitch_timer_ended');
        setSimPhase(PHASE.QA_WAITING);
      }
    }, 1000);
  }, [isScreenSharing, captureScreenFrame, sendScreenFrame]);

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
  // Screen frame periodic capture during formal simulation (pitch + Q&A)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!isScreenSharing) return;

    const isFormalSim = simPhase === PHASE.PITCH_ACTIVE || simPhase === PHASE.QA_WAITING ||
                        simPhase === PHASE.QA_ACTIVE;
    if (isFormalSim) {
      startPeriodicCapture(10000, (base64) => sendScreenFrame(base64));
    } else {
      stopPeriodicCapture();
    }

    return () => stopPeriodicCapture();
  }, [simPhase, isScreenSharing, startPeriodicCapture, stopPeriodicCapture, sendScreenFrame]);

  // Stop screen share capture when simulation ends
  useEffect(() => {
    if (simPhase === PHASE.COACHING || simPhase === PHASE.POST_SIM || simPhase === PHASE.DONE) {
      stopPeriodicCapture();
    }
  }, [simPhase, stopPeriodicCapture]);

  // ---------------------------------------------------------------------------
  // COACHING → POST_SIM transition (after first AI coaching turn)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (simPhase !== PHASE.COACHING || simulationClosingDone) return;

    // On first run in COACHING, record transcript baseline and wait
    if (coachingStartIndexRef.current === -1) {
      coachingStartIndexRef.current = transcript.length;
      return;
    }

    // Only count AI turns that arrived AFTER entering coaching phase
    const newEntries = transcript.slice(coachingStartIndexRef.current);
    const coachingAiTurns = newEntries.filter((e) => e.role === 'ai' && e.isFinal);
    if (coachingAiTurns.length > 0 && !isAISpeaking) {
      setSimulationClosingDone(true);
      setSimPhase(PHASE.POST_SIM);
    }
  }, [simPhase, transcript, isAISpeaking, simulationClosingDone]);

  // ---------------------------------------------------------------------------
  // Voice command detection: "end session" / "terminar sesión" in POST_SIM
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (simPhase !== PHASE.POST_SIM) return;
    const lastUser = [...transcript].reverse().find((e) => e.role === 'user' && e.isFinal);
    if (lastUser) {
      const lower = lastUser.text.toLowerCase();
      if (lower.includes('end session') || lower.includes('terminar sesión') || lower.includes('terminar sesion')) {
        handleEndSession();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      if (!cancelled) await connect({ language, mode });
    };

    init();

    return () => {
      cancelled = true;
      clearAllTimers();
      disconnectRef.current?.();
      cameraStreamRef.current?.getTracks().forEach(t => t.stop());
      stopScreenShare();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearAllTimers = () => {
    clearInterval(pitchTimerRef.current);
  };

  // ---------------------------------------------------------------------------
  // Session actions
  // ---------------------------------------------------------------------------

  const handleEndSession = useCallback(() => {
    clearAllTimers();
    stopScreenShare();
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    if (isChat) {
      // Chat mode: just disconnect and go back to start
      disconnectRef.current?.();
      onReset?.();
    } else {
      setSimPhase(PHASE.DONE);
      requestReport();
    }
  }, [isChat, requestReport, stopScreenShare, onReset]);

  const handleRestart = useCallback(() => {
    clearAllTimers();
    stopScreenShare();
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    disconnectRef.current?.();
    onReset?.();
  }, [stopScreenShare, onReset]);

  const handleSkipToFeedback = useCallback(() => {
    setSimPhase(PHASE.COACHING);
    skipToFeedback();
  }, [skipToFeedback]);

  const toggleMute = () => {
    micStream.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(prev => !prev);
  };

  const toggleVideo = () => {
    cameraStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsVideoOff(prev => !prev);
  };

  const handleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      const started = await startScreenShare();
      if (started) {
        // Capture and send first frame immediately
        setTimeout(() => {
          const frame = captureScreenFrame();
          if (frame) {
            console.log('[ScreenShare] Sending immediate frame on share start');
            sendScreenFrame(frame);
          }
        }, 500); // brief delay for video element to be ready
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Derived UI state
  // ---------------------------------------------------------------------------

  const isConnecting = status === 'connecting';
  const isActive = status === 'active';
  const hasError = status === 'error';

  const statusLabel = isConnecting ? t.connecting
    : hasError ? t.error
    : isAISpeaking ? t.aiSpeaking
    : isActive ? t.listening
    : t.disconnected;

  const phaseLabel = {
    [PHASE.ONBOARDING]: t.onboarding,
    [PHASE.PITCH_INTRO]: t.readyToPitch,
    [PHASE.PITCH_ACTIVE]: t.pitchPhase,
    [PHASE.QA_WAITING]: t.qaSession,
    [PHASE.QA_ACTIVE]: t.qaSession,
    [PHASE.COACHING]: t.coachFeedback,
    [PHASE.POST_SIM]: t.coachAvailable,
    [PHASE.DONE]: t.sessionEnded,
  }[simPhase];

  // Only show pitch timer during pitch phases
  const showPitchTimerFrozen = simPhase === PHASE.PITCH_INTRO;
  const showPitchTimer = simPhase === PHASE.PITCH_ACTIVE;
  const isWarning = showPitchTimer && pitchTimeLeft <= 10;

  const timerColor = isWarning
    ? 'text-red-400 border-red-400/40 bg-red-500/10'
    : showPitchTimer || showPitchTimerFrozen
    ? 'text-orange-400 border-orange-400/40 bg-orange-500/10'
    : '';

  const timerValue = showPitchTimerFrozen
    ? formatTime(PITCH_DURATION)
    : showPitchTimer
    ? formatTime(pitchTimeLeft)
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
          <h2 className="text-2xl font-black text-white">{t.generatingReport}</h2>
          <p className="text-slate-400 text-sm">{t.analyzingPitch}</p>
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

        {/* Timer display — ONLY pitch timer */}
        {timerValue && (
          <div className={`flex items-center gap-3 border rounded-xl px-5 py-2 ${timerColor} ${isWarning ? 'animate-pulse' : ''}`}>
            <span className="material-symbols-outlined text-base">timer</span>
            <span className="text-2xl font-black tabular-nums tracking-tight">{timerValue}</span>
            <span className="text-[10px] font-bold uppercase opacity-70">Pitch</span>
          </div>
        )}

        {/* Post-simulation coaching banner */}
        {(simPhase === PHASE.COACHING || simPhase === PHASE.POST_SIM) && (
          <div className="flex items-center gap-2 border border-emerald-400/30 bg-emerald-400/10 rounded-xl px-5 py-2 text-emerald-400">
            <span className="material-symbols-outlined text-base">psychology</span>
            <span className="text-xs font-bold uppercase tracking-wider">{t.coachMode}</span>
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
          {/* Pitch active indicator */}
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
              <div className={`size-20 rounded-full flex flex-col items-center justify-center border-2 transition-colors duration-300 overflow-hidden ${
                isAISpeaking
                  ? 'border-[#7c5cff] bg-[#7c5cff]/10'
                  : isConnecting
                  ? 'border-slate-600 bg-white/5'
                  : (simPhase === PHASE.COACHING || simPhase === PHASE.POST_SIM)
                  ? 'border-emerald-400 bg-emerald-400/10'
                  : 'border-white/10 bg-white/5'
              }`}>
                <span className={`material-symbols-outlined text-2xl shrink-0 ${(simPhase === PHASE.COACHING || simPhase === PHASE.POST_SIM) ? 'text-emerald-400' : 'text-[#7c5cff]'}`}>
                  {isAISpeaking
                    ? 'record_voice_over'
                    : isConnecting
                    ? 'hourglass_empty'
                    : (simPhase === PHASE.COACHING || simPhase === PHASE.POST_SIM)
                    ? 'psychology'
                    : 'mic'}
                </span>
                <span className="text-[7px] font-bold uppercase text-slate-400 tracking-tight mt-1 text-center leading-tight w-full px-2 truncate">
                  {statusLabel}
                </span>
              </div>
            </div>

            {/* AI Waveform */}
            <div className="flex flex-col items-center gap-2 w-full">
              <div className="flex items-end gap-1 h-10">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-150 ${
                      isAISpeaking
                        ? (simPhase === PHASE.COACHING || simPhase === PHASE.POST_SIM) ? 'bg-emerald-400' : 'bg-[#7c5cff]'
                        : 'bg-white/10'
                    }`}
                    style={{
                      height: isAISpeaking ? `${20 + Math.sin(Date.now() / 200 + i * 0.8) * 24 + 24}%` : '15%',
                      animation: isAISpeaking ? `bounce ${0.4 + (i % 3) * 0.15}s ease-in-out infinite alternate` : 'none',
                    }}
                  />
                ))}
              </div>
              {/* User mic waveform */}
              {isActive && !isMuted && (
                <div className="flex items-end gap-1 h-6">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-100 ${isUserSpeaking ? 'bg-teal-400/80' : 'bg-white/5'}`}
                      style={{
                        height: isUserSpeaking ? `${30 + Math.sin(Date.now() / 150 + i * 1.1) * 40 + 30}%` : '20%',
                        animation: isUserSpeaking ? `bounce ${0.3 + (i % 3) * 0.1}s ease-in-out infinite alternate` : 'none',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="text-center space-y-2 max-w-xs">
              <p className="text-slate-300 text-sm font-medium">
                {simPhase === PHASE.ONBOARDING && (
                  isAISpeaking ? t.aiSpeakingMsg : isConnecting ? t.startingSession : t.answerOnboarding
                )}
                {simPhase === PHASE.PITCH_INTRO && (
                  isAISpeaking ? t.aiSpeakingMsg : t.timerWillStart
                )}
                {simPhase === PHASE.PITCH_ACTIVE && (
                  isAISpeaking ? t.aiSpeakingMsg : t.givePitch
                )}
                {simPhase === PHASE.QA_WAITING && t.waitingQuestion}
                {simPhase === PHASE.QA_ACTIVE && (
                  isAISpeaking ? t.aiAsking : t.answerQuestion
                )}
                {simPhase === PHASE.COACHING && t.coachSummary}
                {simPhase === PHASE.POST_SIM && t.askAnything}
              </p>

              {/* Q&A question counter */}
              {(simPhase === PHASE.QA_WAITING || simPhase === PHASE.QA_ACTIVE) && questionsAnswered > 0 && (
                <p className="text-slate-500 text-xs">{t.answersGiven(questionsAnswered)}</p>
              )}

              <p className="text-slate-600 text-xs uppercase tracking-widest">{t.realtimeBadge}</p>
            </div>

            {/* Manual start-timer button */}
            {simPhase === PHASE.PITCH_INTRO && !isAISpeaking && (
              <button
                onClick={startPitchCountdown}
                className="flex items-center gap-2 bg-orange-500/10 border border-orange-400/40 text-orange-400 hover:bg-orange-500 hover:text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200"
              >
                <span className="material-symbols-outlined text-base">timer</span>
                {t.startTimer}
              </button>
            )}

            {/* Q&A phase: Restart and Skip buttons */}
            {(simPhase === PHASE.QA_WAITING || simPhase === PHASE.QA_ACTIVE) && (
              <div className="flex flex-col gap-2 w-full max-w-xs">
                <button
                  onClick={handleSkipToFeedback}
                  className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-500 hover:text-white px-4 py-2 rounded-xl font-bold text-xs transition-all"
                >
                  <span className="material-symbols-outlined text-sm">fast_forward</span>
                  {t.skipToFeedback}
                </button>
                <button
                  onClick={() => setShowRestartConfirm(true)}
                  className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white px-4 py-2 rounded-xl font-bold text-xs transition-all"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  {t.restartSession}
                </button>
              </div>
            )}

            {/* Post-simulation: report ready card (practice mode only) */}
            {simPhase === PHASE.POST_SIM && !isChat && (
              <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-4 text-center space-y-3 max-w-xs">
                <p className="text-emerald-400 text-sm font-medium">{t.reportReady}</p>
                <button
                  onClick={handleEndSession}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all w-full"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-base">assignment</span>
                    {t.endAndView}
                  </span>
                </button>
              </div>
            )}

            {isActive && !isMuted && simPhase !== PHASE.POST_SIM && (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
                <span className="material-symbols-outlined text-base text-[#7c5cff]">mic</span>
                <span className="text-xs text-slate-400">{t.micActive}</span>
              </div>
            )}

            {hasError && (
              <button
                onClick={() => connect({ language, mode })}
                className="bg-[#7c5cff] hover:bg-[#7c5cff]/90 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all"
              >
                {t.retry}
              </button>
            )}
          </div>

          <div className="p-4 border-t border-white/5 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest">
              {t.aiConducts}
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
            <span className="text-[9px] font-bold uppercase mt-1">{isMuted ? t.unmute : t.mute}</span>
          </button>

          <button
            onClick={toggleVideo}
            className={`flex flex-col items-center justify-center size-14 rounded-xl hover:bg-white/5 transition-colors ${
              isVideoOff ? 'text-red-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">{isVideoOff ? 'videocam_off' : 'videocam'}</span>
            <span className="text-[9px] font-bold uppercase mt-1">{isVideoOff ? t.camOn : t.camOff}</span>
          </button>

          {/* Screen share button */}
          <button
            onClick={handleScreenShare}
            disabled={!isActive}
            className={`flex flex-col items-center justify-center size-14 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-30 ${
              isScreenSharing ? 'text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-2xl">{isScreenSharing ? 'stop_screen_share' : 'screen_share'}</span>
            <span className="text-[9px] font-bold uppercase mt-1">{isScreenSharing ? t.stop : t.share}</span>
          </button>

          <div className="w-px h-8 bg-white/10 mx-2" />

          <button
            onClick={handleEndSession}
            className="flex items-center gap-3 px-6 h-14 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300"
          >
            <span className="material-symbols-outlined">call_end</span>
            <span className="font-bold text-sm uppercase tracking-wide">{t.endSession}</span>
          </button>
        </div>
      </footer>

      <div className="pb-4 text-center">
        <p className="text-[9px] text-slate-600 uppercase tracking-[0.3em]">
          Voice Mode • Gemini 2.0 Flash Live • Charon
        </p>
      </div>

      {/* Screen share fixed PiP overlay */}
      {isScreenSharing && (
        <div className="fixed bottom-6 right-6 w-60 rounded-xl overflow-hidden border border-emerald-400/50 shadow-2xl bg-black z-50">
          <video
            ref={screenPreviewRef}
            autoPlay
            muted
            playsInline
            className="w-full block"
          />
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[9px] font-bold uppercase text-emerald-400 tracking-wider">{t.sharingScreen}</span>
          </div>
        </div>
      )}

      {/* Restart confirmation modal */}
      {showRestartConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1a1a24] border border-white/10 rounded-2xl p-8 max-w-sm w-full shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <span className="material-symbols-outlined text-amber-400 text-4xl">warning</span>
              <p className="text-white font-bold text-lg">{t.restartSession}</p>
              <p className="text-slate-400 text-sm">{t.restartConfirm}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 font-bold text-sm transition-all"
              >
                {t.confirmNo}
              </button>
              <button
                onClick={() => { setShowRestartConfirm(false); handleRestart(); }}
                className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm transition-all"
              >
                {t.confirmYes}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
