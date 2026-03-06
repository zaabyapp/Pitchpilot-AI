import React, { useEffect, useRef } from 'react';

function VideoPreview({ stream }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video 
      ref={videoRef} 
      autoPlay 
      playsInline 
      muted 
      className="video-preview"
    />
  );
}

export default VideoPreview;
