import React, { useState, useEffect } from 'react';
import '../styles/SimulationTimer.css';

function SimulationTimer({ duration }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const percentage = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="simulation-timer">
      <div className="timer-display">
        <span className="time">{timeLeft}s</span>
        <span className="label">Pitch Time</span>
      </div>
      <div className="timer-bar">
        <div className="timer-progress" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default SimulationTimer;
