import { useRef, useState, useCallback } from 'react';

const WS_URL =
  process.env.NODE_ENV === 'production'
    ? `wss://${window.location.host}/ws/voice`
    : 'ws://localhost:3001/ws/voice';

/**
 * Manages a real-time voice session with the PitchPilot backend.
 *
 * Audio pipeline:
 *   Mic (native rate) → AudioContext @16kHz (resamples) → ScriptProcessor
 *   → PCM Int16 base64 → WebSocket → backend → Gemini Live API
 *
 *   Gemini audio → backend → WebSocket → base64 PCM Int16 @24kHz
 *   → AudioContext @24kHz → scheduled playback
 *
 * @param {object} opts
 * @param {function} opts.onEvent - called with phase_event, session_data, etc.
 */
export function useVoiceSession({ onEvent } = {}) {
  const [status, setStatus] = useState('idle'); // idle | connecting | active | error
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [transcript, setTranscript] = useState([]); // { role, text, timestamp }[]
  const [reportData, setReportData] = useState(null); // { data, transcript } from backend

  const wsRef = useRef(null);
  const micStreamRef = useRef(null);
  const inputCtxRef = useRef(null);
  const outputCtxRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);
  const nextPlayTimeRef = useRef(0);
  const speakingTimerRef = useRef(null);
  const sessionStartRef = useRef(Date.now());
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent; // keep ref current without adding to dep arrays

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
    [getOutputCtx]
  );

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

  const addTranscriptEntry = useCallback((role, text, timestamp) => {
    const entry = { role, text, timestamp: timestamp ?? Date.now() - sessionStartRef.current };
    setTranscript((prev) => {
      // If last entry is same role and was partial, merge; otherwise append
      const last = prev[prev.length - 1];
      if (last && last.role === role && !last.isFinal) {
        return [...prev.slice(0, -1), { ...last, text: last.text + text }];
      }
      return [...prev, entry];
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Session control
  // ---------------------------------------------------------------------------

  const connect = useCallback(
    async ({ language = 'en' } = {}) => {
      setStatus('connecting');
      setTranscript([]);
      sessionStartRef.current = Date.now();

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'init', language }));
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
            const role = msg.role === 'model' ? 'ai' : 'user';
            addTranscriptEntry(role, msg.text, Date.now() - sessionStartRef.current);
          } else if (msg.type === 'phase_event') {
            onEventRef.current?.({ type: 'phase_event', event: msg.event });
          } else if (msg.type === 'report') {
            // AI-generated feedback report + final transcript from backend
            setReportData({ data: msg.data, transcript: msg.transcript });
            onEventRef.current?.({ type: 'report', data: msg.data, transcript: msg.transcript });
          } else if (msg.type === 'turn_complete') {
            // Mark the last AI transcript entry as final
            setTranscript((prev) => {
              if (prev.length === 0) return prev;
              const last = prev[prev.length - 1];
              if (last.role === 'ai') {
                return [...prev.slice(0, -1), { ...last, isFinal: true }];
              }
              return prev;
            });
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
      };

      ws.onerror = () => {
        setStatus('error');
      };
    },
    [setupMicrophone, scheduleAudioChunk, addTranscriptEntry]
  );

  const disconnect = useCallback(() => {
    if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);

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
  }, []);

  /**
   * Inject a text message into the live Gemini session.
   * Used to send <<SYSTEM_EVENT>> orchestration cues when timers expire.
   */
  const injectText = useCallback((text) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'inject_text', text }));
    }
  }, []);

  /**
   * Signal end of session to backend and stop mic/audio, but keep the WebSocket
   * open to receive the AI-generated feedback report.
   * Call disconnect() once the report arrives to finish cleanup.
   */
  const requestReport = useCallback(() => {
    if (speakingTimerRef.current) clearTimeout(speakingTimerRef.current);
    // Tell backend to close Gemini and generate the report
    try { wsRef.current?.send(JSON.stringify({ type: 'end_session' })); } catch (_) {}
    // Stop mic and audio processing — no more audio needed
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
    // WS stays open — backend will send { type: 'report' } then close
  }, []);

  return {
    /** 'idle' | 'connecting' | 'active' | 'error' */
    status,
    /** true while Gemini audio is playing */
    isAISpeaking,
    /** ref to the raw mic MediaStream */
    micStream: micStreamRef,
    /** accumulated transcript entries { role, text, timestamp, isFinal } */
    transcript,
    /** AI-generated report data once session ends, null until then */
    reportData,
    connect,
    disconnect,
    injectText,
    requestReport,
  };
}
