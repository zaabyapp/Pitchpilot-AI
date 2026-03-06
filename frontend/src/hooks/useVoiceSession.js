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
 */
export function useVoiceSession() {
  const [status, setStatus] = useState('idle'); // idle | connecting | active | error
  const [isAISpeaking, setIsAISpeaking] = useState(false);

  const wsRef = useRef(null);
  const micStreamRef = useRef(null);    // raw MediaStream (audio tracks)
  const inputCtxRef = useRef(null);     // AudioContext at 16kHz
  const outputCtxRef = useRef(null);    // AudioContext at 24kHz
  const processorRef = useRef(null);    // ScriptProcessorNode
  const sourceRef = useRef(null);       // MediaStreamAudioSourceNode
  const nextPlayTimeRef = useRef(0);    // scheduled end of last audio chunk
  const speakingTimerRef = useRef(null);

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

      // base64 → Uint8Array → Int16Array → Float32Array
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

      // Schedule gaplessly after the previous chunk
      const startAt = Math.max(nextPlayTimeRef.current, ctx.currentTime + 0.04);
      src.start(startAt);
      nextPlayTimeRef.current = startAt + buffer.duration;

      setIsAISpeaking(true);
      // Clear speaking state after the last scheduled chunk finishes
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

    // Creating an AudioContext at 16kHz causes the browser to internally
    // resample the mic stream from its native rate to 16kHz.
    const ctx = new AudioContext({ sampleRate: 16000 });
    inputCtxRef.current = ctx;

    const source = ctx.createMediaStreamSource(stream);
    sourceRef.current = source;

    // 4096 samples @ 16kHz ≈ 256 ms per chunk — a comfortable size for Gemini
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) return;

      const float32 = e.inputBuffer.getChannelData(0);

      // Float32 → PCM Int16
      const int16 = new Int16Array(float32.length);
      for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        int16[i] = s < 0 ? s * 32768 : s * 32767;
      }

      // Int16 → base64 (chunked to avoid call-stack limits)
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
    // Must connect to destination to keep ScriptProcessorNode alive in Chrome
    processor.connect(ctx.destination);
  }, []);

  // ---------------------------------------------------------------------------
  // Session control
  // ---------------------------------------------------------------------------

  const connect = useCallback(
    async ({ language = 'en' } = {}) => {
      setStatus('connecting');

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
          } else if (msg.type === 'turn_complete') {
            // AI finished speaking — handled by the speaking timer
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
    [setupMicrophone, scheduleAudioChunk]
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

  return {
    /** 'idle' | 'connecting' | 'active' | 'error' */
    status,
    /** true while Gemini audio is playing */
    isAISpeaking,
    /** ref to the raw mic MediaStream — use to mute/unmute audio tracks */
    micStream: micStreamRef,
    connect,
    disconnect,
  };
}
