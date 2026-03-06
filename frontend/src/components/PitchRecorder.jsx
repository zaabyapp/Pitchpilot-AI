import React, { useState, useRef, useEffect } from 'react';
import { useVoiceSession } from '../hooks/useVoiceSession';

export default function PitchRecorder({ language, onSessionEnd }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  const { status, isAISpeaking, micStream, connect, disconnect } = useVoiceSession();

  // Initialise camera (video preview) and voice session on mount
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // Camera — video-only stream for self-preview
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

      // Voice session (captures audio-only internally)
      if (!cancelled) await connect({ language });
    };

    init();

    return () => {
      cancelled = true;
      disconnect();
      cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = () => {
    micStream.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(prev => !prev);
  };

  const toggleVideo = () => {
    cameraStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsVideoOff(prev => !prev);
  };

  const handleEndSession = () => {
    disconnect();
    cameraStreamRef.current?.getTracks().forEach(t => t.stop());
    onSessionEnd();
  };

  // --------------------------------------------------------------------------
  // Derived UI state
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div className="flex h-screen flex-col bg-[#0a0812] text-slate-100 overflow-hidden">

      {/* Header */}
      <header className="flex flex-col items-center pt-8 pb-4 relative z-10">
        <div className="bg-[#7c5cff]/10 border border-[#7c5cff]/20 px-4 py-1.5 rounded-full flex items-center gap-2 mb-6">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${hasError ? 'bg-red-500' : 'bg-[#7c5cff]'} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${hasError ? 'bg-red-500' : 'bg-[#7c5cff]'}`} />
          </span>
          <span className="text-[#7c5cff] text-[10px] font-bold uppercase tracking-[0.15em]">
            PitchPilot AI — Voice Session
          </span>
        </div>

        {/* AI speaking visualiser */}
        <div className="relative size-32 flex items-center justify-center">
          {/* Outer pulse ring when AI is speaking */}
          {isAISpeaking && (
            <span className="absolute inset-0 rounded-full bg-[#7c5cff]/20 animate-ping" />
          )}
          <div className={`size-24 rounded-full flex flex-col items-center justify-center border-2 transition-colors duration-300 ${
            isAISpeaking
              ? 'border-[#7c5cff] bg-[#7c5cff]/10'
              : isConnecting
              ? 'border-slate-600 bg-white/5'
              : 'border-white/10 bg-white/5'
          }`}>
            <span className="material-symbols-outlined text-3xl text-[#7c5cff]">
              {isAISpeaking ? 'record_voice_over' : isConnecting ? 'hourglass_empty' : 'mic'}
            </span>
            <span className="text-[8px] font-bold uppercase text-slate-400 tracking-widest mt-1 text-center leading-tight px-1">
              {statusLabel}
            </span>
          </div>
        </div>
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
        </div>

        {/* AI status panel */}
        <div className="w-1/2 flex flex-col bg-[#1a1a24]/80 rounded-2xl border border-white/10 overflow-hidden">

          {/* AI avatar / waveform area */}
          <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">

            {/* Waveform animation */}
            <div className="flex items-end gap-1 h-16">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 rounded-full transition-all duration-150 ${
                    isAISpeaking ? 'bg-[#7c5cff]' : 'bg-white/10'
                  }`}
                  style={{
                    height: isAISpeaking
                      ? `${20 + Math.sin(Date.now() / 200 + i * 0.8) * 28 + 28}%`
                      : '15%',
                    animationDelay: `${i * 80}ms`,
                    animation: isAISpeaking ? `bounce ${0.4 + (i % 3) * 0.15}s ease-in-out infinite alternate` : 'none',
                  }}
                />
              ))}
            </div>

            <div className="text-center space-y-2">
              <p className="text-slate-300 text-sm font-medium">
                {isAISpeaking
                  ? (language === 'es' ? 'PitchPilot AI está hablando…' : 'PitchPilot AI is speaking…')
                  : isConnecting
                  ? (language === 'es' ? 'Iniciando sesión de voz…' : 'Starting voice session…')
                  : isActive
                  ? (language === 'es' ? 'Hable libremente — el AI escucha' : 'Speak freely — AI is listening')
                  : hasError
                  ? (language === 'es' ? 'Error de conexión. Intente de nuevo.' : 'Connection error. Please try again.')
                  : (language === 'es' ? 'Sesión finalizada' : 'Session ended')}
              </p>
              <p className="text-slate-600 text-xs uppercase tracking-widest">
                {language === 'es'
                  ? 'Sesión de voz en tiempo real • Gemini Live API'
                  : 'Real-time voice session • Gemini Live API'}
              </p>
            </div>

            {/* Mic level indicator */}
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
                {language === 'es' ? 'Reintentar conexión' : 'Retry connection'}
              </button>
            )}
          </div>

          {/* Instructions footer */}
          <div className="p-4 border-t border-white/5 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest">
              {language === 'es'
                ? 'El AI conducirá la sesión completa por voz'
                : 'AI will conduct the full session by voice'}
            </p>
          </div>
        </div>
      </main>

      {/* Footer controls */}
      <footer className="p-8 flex items-center justify-center">
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
            <span className="text-[9px] font-bold uppercase mt-1">{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
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

      <div className="pb-6 text-center">
        <p className="text-[9px] text-slate-600 uppercase tracking-[0.3em]">
          Voice Mode • Gemini 2.5 Flash Native Audio
        </p>
      </div>
    </div>
  );
}
