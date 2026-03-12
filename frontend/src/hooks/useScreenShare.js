import { useRef, useState, useCallback } from 'react';

/**
 * Optional screen sharing for visual pitch context.
 *
 * Usage:
 *   const { isScreenSharing, startScreenShare, stopScreenShare, captureFrame, startPeriodicCapture, stopPeriodicCapture } = useScreenShare();
 *
 *   // Start sharing (user picks screen/window)
 *   await startScreenShare();
 *
 *   // Capture a single frame (returns base64 JPEG or null)
 *   const frame = captureFrame();
 *
 *   // Start periodic captures every 15s — calls onFrame(base64) for each
 *   startPeriodicCapture(15000, onFrame);
 *
 *   // Stop periodic captures (keeps screen share active)
 *   stopPeriodicCapture();
 *
 *   // Stop screen share entirely
 *   stopScreenShare();
 */
export function useScreenShare() {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const streamRef = useRef(null);
  const videoElRef = useRef(null);
  const intervalRef = useRef(null);
  const onFrameRef = useRef(null);

  const captureFrame = useCallback(() => {
    const video = videoElRef.current;
    if (!video || video.videoWidth === 0) return null;

    try {
      // Use native video resolution — do not downscale so text remains readable
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const base64 = dataUrl.split(',')[1] || null;
      if (base64) {
        console.log(`[ScreenShare] Frame captured — ${canvas.width}x${canvas.height}, size: ${base64.length} bytes, preview: ${base64.slice(0, 100)}`);
      }
      return base64;
    } catch (err) {
      console.warn('[ScreenShare] captureFrame error:', err.message);
      return null;
    }
  }, []);

  const stopPeriodicCapture = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stopScreenShare = useCallback(() => {
    stopPeriodicCapture();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoElRef.current) {
      videoElRef.current.srcObject = null;
      videoElRef.current = null;
    }
    onFrameRef.current = null;
    setScreenStream(null);
    setIsScreenSharing(false);
  }, [stopPeriodicCapture]);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      });
      streamRef.current = stream;

      // Create hidden video element for frame capture
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      videoElRef.current = video;

      setScreenStream(stream);
      setIsScreenSharing(true);
      console.log('[ScreenShare] Screen share started');

      // Handle user stopping share via browser UI
      stream.getVideoTracks()[0]?.addEventListener('ended', () => {
        stopScreenShare();
      });

      return true;
    } catch (err) {
      console.warn('[useScreenShare] Screen share not available:', err.message);
      return false;
    }
  }, [stopScreenShare]);

  const startPeriodicCapture = useCallback(
    (intervalMs = 15000, onFrame = null) => {
      onFrameRef.current = onFrame;
      stopPeriodicCapture();

      const doCapture = () => {
        const base64 = captureFrame();
        if (base64 && onFrameRef.current) {
          onFrameRef.current(base64);
        }
      };

      // Capture immediately, then periodically
      doCapture();
      intervalRef.current = setInterval(doCapture, intervalMs);
    },
    [captureFrame, stopPeriodicCapture],
  );

  return {
    isScreenSharing,
    screenStream,
    startScreenShare,
    stopScreenShare,
    captureFrame,
    startPeriodicCapture,
    stopPeriodicCapture,
  };
}
