import React, { useState, useRef } from 'react';
import VideoPreview from './VideoPreview';
import SimulationTimer from './SimulationTimer';
import ChatDisplay from './ChatDisplay';
import AudioVisualizer from './AudioVisualizer';
import '../styles/PitchRecorder.css';

function PitchRecorder({ language, onSessionEnd }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const mediaStreamRef = useRef(null);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: 1280, height: 720 }
      });
      mediaStreamRef.current = stream;
      setIsRecording(true);
      setIsSimulating(true);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Please allow microphone and camera access to continue');
    }
  };

  const handleStopRecording = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
      setIsRecording(false);
      setIsSimulating(false);
    }
  };

  return (
    <div className="pitch-recorder">
      <div className="recorder-grid">
        <div className="video-section">
          {isRecording && <VideoPreview stream={mediaStreamRef.current} />}
          {isSimulating && <SimulationTimer duration={45} />}
        </div>

        <div className="chat-section">
          <ChatDisplay language={language} />
        </div>
      </div>

      <div className="controls">
        {!isRecording ? (
          <button 
            className="btn btn-primary"
            onClick={handleStartRecording}
          >
            🎤 Start Pitch Session
          </button>
        ) : (
          <>
            <div className="audio-visualizer-wrapper">
              <AudioVisualizer stream={mediaStreamRef.current} />
            </div>
            <button 
              className="btn btn-danger"
              onClick={handleStopRecording}
            >
              ⏹️ End Session
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default PitchRecorder;
