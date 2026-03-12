import { useRef, useState, useCallback } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
const WS_URL = BACKEND_URL.replace(/^http/, 'ws') + '/ws/voice';

// Unified filter: returns true if text should NOT appear in the visible transcript
const shouldFilter = (text) => {
  if (!text || text.trim().length < 4) return true;
  const t = text.trim();
  if (t.includes('<<SYSTEM_EVENT>>')) return true;
  if (/^\d[\d\s]*$/.test(t)) return true;
  if (/\*\*.*\*\*/.test(t)) return true;
  if (/^(I've|I have|I'm now|I will|I've crafted|I've formulated)/i.test(t)) return true;
  if (/^(Initiating|Formulating|Defining|Confirming|Transitioning|Building|Crafting)/i.test(t)) return true;
  if (/^(Now I|Now,? I'm|My goal|My next step|With that|I've got)/i.test(t)) return true;
  if (t.includes('pitch_timer_ended') || t.includes('qa_timer_ended') || t.includes('qa_complete')) return true;
  return false;
};

const STALL_TIMEOUT_MS = 9000;

/**
 * Manages a real-time voice session with the PitchPilot backend.
 *
 * Audio pipeline:
 *   Mic (native rate) → AudioContext @16kHz (resamples) → ScriptProcessor
 *   → PCM Int16 base64 → WebSocket → backend → Gemini Live API
 *
 *   Gemini audio → backend → WebSocket → base64 PCM Int16 @24kHz
 *   → AudioContext @24kHz → scheduled playback
 */
export function useVoiceSession({ onEvent } = {}) {
  const [status, setStatus] = useState('idle'); // idle | connecting | active | error
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isStalled, setIsStalled] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState([]); // { role, text, timestamp }[]
  const [reportData, setReportData] = useState(null); // { data, transcript } from backend

  const wsRef = useRef(null);
  const micStreamRef = useRef(null);
  const inputCtxRef = useRef(null);
  const outputCtxRef = useRef(null);
  const aiBufferRef = useRef('');
  const userBufferRef = useRef('');
  const userTurnStartRef = useRef(0);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const nextPlayTimeRef = useRef(0);
  const speakingTimerRef = useRef(null);
  const userSpeechTimeoutRef = useRef(null);
  const stallTimerRef = useRef(null);
  const analyserRef = useRef(null);
  const micPollFrameRef = useRef(null);
  const sessionStartRef = useRef(Date.now());
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  // ---------------------------------------------------------------------------
  // Audio playback
  // ---------------------------------------------------------------------------

  const getOutputCtx = useCallback(() => {
    if (!outputCtxRef.current || outputCtxRef.current.state === 'closed') {
      outputCtxRef.current = new AudioContext({ sampleRate: 24000 });
      nextPlayTimeRef.current = 0;
    }
    if (outputCtxRef.current.state === 'suspended') {
      outputCtxRef.current.resume();
    }
    return outputCtxRef.current;
  }, []);

  const scheduleAudioChunk = useCallback(
    (base64Data) => {
      const ctx = getOutputCtx();

      // Clear stall state on first AI audio chunk
      if (stallTimerRef.current) {
        clearTimeout(stallTimerRef.current);
        stallTimerRef.current = null;
      }
      if (isStalled) setIsStalled(false);
      console.log('[timing] first_ai_audio_started', Date.now());

      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      if (bytes.length < 2) return;

      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;

      const buffer = ctx.createBuffer(1, float32.length, 24000);
      buffer.copyToChannel(float32, 0);

      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);

      const startAt = Math.max(nextPlayTimeRef.current, ctx.currentTime + 0.04);
      src.start(startAt);
      nextPlayTimeRef.current = startAt + buffer.duration;

      setIsAISpeaking(true);
      if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
      const msUntilDone = (nextPlayTimeRef.current - ctx.currentTime + 0.3) * 1000;
      speakingTimerRef.current = setTimeout(() => setIsAISpeaking(false), msUntilDone);
    },
    [getOutputCtx, isStalled]
  );

  // ---------------------------------------------------------------------------
  // Stall detection
  // ---------------------------------------------------------------------------

  const startStallTimer = useCallback(() => {
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    stallTimerRef.current = setTimeout(() => {
      setIsStalled(true);
      console.log('[timing] stall_detected', Date.now());
    }, STALL_TIMEOUT_MS);
  }, []);

  // ---------------------------------------------------------------------------
  // Microphone capture
  // ---------------------------------------------------------------------------

  const setupMicrophone = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    micStreamRef.current = stream;

    const ctx = new AudioContext({ sampleRate: 16000 });
    inputCtxRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    sourceRef.current = source;

    // Analyser for user speaking detection
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    source.connect(analyser);

    // Poll mic level with requestAnimationFrame
    const timeDomainData = new Uint8Array(analyser.fftSize);
    const pollMicLevel = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteTimeDomainData(timeDomainData);
      const avg = timeDomainData.reduce((sum, v) => sum + Math.abs(v - 128), 0) / timeDomainData.length;
      setIsUserSpeaking(avg > 4);
      micPollFrameRef.current = requestAnimationFrame(pollMicLevel);
    };
    micPollFrameRef.current = requestAnimationFrame(pollMicLevel);

    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) return;

      const float32 = e.inputBuffer.getChannelData(0);
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 32768 : s * 32767;
      }

      const bytes = new Uint8Array(int16.buffer);
      let binary = '';
      const step = 8192;
      for (let i = 0; i < bytes.length; i += step) {
        binary += String.fromCharCode(...bytes.subarray(i, i + step));
      }
      const base64 = btoa(binary);

      wsRef.current.send(JSON.stringify({ type: 'audio', data: base64 }));
    };

    source.connect(processor);
    processor.connect(ctx.destination);
  }, []);

  // ---------------------------------------------------------------------------
  // Transcript helpers
  // ---------------------------------------------------------------------------

  const flushUserBuffer = useCallback(() => {
    if (userSpeechTimeoutRef.current) {
      clearTimeout(userSpeechTimeoutRef.current);
      userSpeechTimeoutRef.current = null;
    }
    const text = userBufferRef.current.trim();
    if (!shouldFilter(text)) {
      setTranscript((prev) => [
        ...prev,
        { role: 'user', text, timestamp: userTurnStartRef.current, isFinal: true },
      ]);
    }
    userBufferRef.current = '';

    // Start stall timer — we expect AI to respond soon
    startStallTimer();
  }, [startStallTimer]);

  // ---------------------------------------------------------------------------
  // Session control
  // ---------------------------------------------------------------------------

  const connect = useCallback(
    async ({ language = 'en', mode = 'practice' } = {}) => {
      setStatus('connecting');
      setTranscript([]);
      setIsStalled(false);
      setIsUserSpeaking(false);
      sessionStartRef.current = Date.now();
      aiBufferRef.current = '';
      userBufferRef.current = '';
      userTurnStartRef.current = 0;

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'init', language, mode }));
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'ready') {
            await setupMicrophone();
            setStatus('active');
          } else if (msg.type === 'audio') {
            scheduleAudioChunk(msg.data);
          } else if (msg.type === 'transcript') {
            const text = msg.text ?? '';
            if (shouldFilter(text)) return;

            if (msg.role === 'model') {
              aiBufferRef.current += text;
              // Clear stall on first AI text
              if (stallTimerRef.current) {
                clearTimeout(stallTimerRef.current);
                stallTimerRef.current = null;
              }
              setIsStalled(false);
              console.log('[timing] first_ai_chunk_received', Date.now());
            } else {
              if (!userBufferRef.current) {
                userTurnStartRef.current = Date.now() - sessionStartRef.current;
                console.log('[timing] user_turn_start', Date.now());
              }
              userBufferRef.current += text;
              if (userSpeechTimeoutRef.current) clearTimeout(userSpeechTimeoutRef.current);
              userSpeechTimeoutRef.current = setTimeout(() => {
                userSpeechTimeoutRef.current = null;
                console.log('[timing] user_turn_end', Date.now());
                const t = userBufferRef.current.trim();
                if (!shouldFilter(t)) {
                  setTranscript((prev) => [
                    ...prev,
                    { role: 'user', text: t, timestamp: userTurnStartRef.current, isFinal: true },
                  ]);
                }
                userBufferRef.current = '';
                // Start stall timer after user finishes
                startStallTimer();
              }, 200);
            }
          } else if (msg.type === 'phase_event') {
            onEventRef.current?.({ type: 'phase_event', phase: msg.phase, count: msg.count });
          } else if (msg.type === 'report') {
            setReportData({ data: msg.data, transcript: msg.transcript });
            onEventRef.current?.({ type: 'report', data: msg.data, transcript: msg.transcript });
          } else if (msg.type === 'turn_complete') {
            if (userBufferRef.current.trim()) flushUserBuffer();

            const aiText = aiBufferRef.current.trim();
            if (!shouldFilter(aiText)) {
              const ts = Date.now() - sessionStartRef.current;
              setTranscript((prev) => [...prev, { role: 'ai', text: aiText, timestamp: ts, isFinal: true }]);
            }
            aiBufferRef.current = '';
          } else if (msg.type === 'error') {
            console.error('[useVoiceSession] Server error:', msg.message);
            setStatus('error');
          }
        } catch (err) {
          console.error('[useVoiceSession] Message parse error:', err);
        }
      };

      ws.onclose = () => {
        setStatus('idle');
        setIsAISpeaking(false);
        setIsStalled(false);
        setIsUserSpeaking(false);
        if (stallTimerRef.current) { clearTimeout(stallTimerRef.current); stallTimerRef.current = null; }
        if (micPollFrameRef.current) { cancelAnimationFrame(micPollFrameRef.current); micPollFrameRef.current = null; }
        analyserRef.current = null;
      };

      ws.onerror = () => {
        setStatus('error');
      };
    },
    [setupMicrophone, scheduleAudioChunk, flushUserBuffer, startStallTimer]
  );

  const disconnect = useCallback(() => {
    if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    if (userSpeechTimeoutRef.current) clearTimeout(userSpeechTimeoutRef.current);
    if (stallTimerRef.current) { clearTimeout(stallTimerRef.current); stallTimerRef.current = null; }
    if (micPollFrameRef.current) { cancelAnimationFrame(micPollFrameRef.current); micPollFrameRef.current = null; }
    analyserRef.current = null;

    try { wsRef.current?.send(JSON.stringify({ type: 'end_session' })); } catch (_) {}
    wsRef.current?.close();
    wsRef.current = null;

    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    inputCtxRef.current?.close();
    outputCtxRef.current?.close();

    processorRef.current = null;
    sourceRef.current = null;
    micStreamRef.current = null;
    inputCtxRef.current = null;
    outputCtxRef.current = null;
    nextPlayTimeRef.current = 0;

    setStatus('idle');
    setIsAISpeaking(false);
    setIsStalled(false);
    setIsUserSpeaking(false);
  }, []);

  const injectText = useCallback((text) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'inject_text', text }));
      console.log('[timing] request_sent', Date.now(), text);
      // Start stall timer after injection (we expect AI to respond)
      startStallTimer();
    }
  }, [startStallTimer]);

  const sendScreenFrame = useCallback((base64Data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'screen_frame', data: base64Data }));
      console.log('[timing] screen_frame_sent', Date.now());
      wsRef.current.send(JSON.stringify({
        type: 'screen_context',
        text: 'This is a screenshot of what the user is currently showing on their screen. Please read ALL visible text carefully and use it as context for this conversation.',
      }));
    }
  }, []);

  const requestReport = useCallback(() => {
    if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    if (userSpeechTimeoutRef.current) clearTimeout(userSpeechTimeoutRef.current);
    if (stallTimerRef.current) { clearTimeout(stallTimerRef.current); stallTimerRef.current = null; }
    if (micPollFrameRef.current) { cancelAnimationFrame(micPollFrameRef.current); micPollFrameRef.current = null; }
    analyserRef.current = null;

    try { wsRef.current?.send(JSON.stringify({ type: 'end_session' })); } catch (_) {}

    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    inputCtxRef.current?.close();
    outputCtxRef.current?.close();
    processorRef.current = null;
    sourceRef.current = null;
    micStreamRef.current = null;
    inputCtxRef.current = null;
    outputCtxRef.current = null;
    nextPlayTimeRef.current = 0;
    setIsAISpeaking(false);
    setIsStalled(false);
    setIsUserSpeaking(false);
  }, []);

  const skipToFeedback = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'skip_qa' }));
    }
  }, []);

  return {
    status,
    isAISpeaking,
    isStalled,
    isUserSpeaking,
    micStream: micStreamRef,
    transcript,
    reportData,
    connect,
    disconnect,
    injectText,
    sendScreenFrame,
    requestReport,
    skipToFeedback,
  };
}
