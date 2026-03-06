import React, { useState } from 'react';
import LanguageSelector from './components/LanguageSelector';
import PitchRecorder from './components/PitchRecorder';
import './App.css';

function App() {
  const [language, setLanguage] = useState(null);
  const [sessionStarted, setSessionStarted] = useState(false);

  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    setSessionStarted(true);
  };

  const handleSessionEnd = () => {
    setLanguage(null);
    setSessionStarted(false);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎤 PitchPilot AI</h1>
        <p>AI Pitch Coach for Builders</p>
      </header>

      <main className="app-main">
        {!sessionStarted ? (
          <LanguageSelector onSelectLanguage={handleLanguageSelect} />
        ) : (
          <PitchRecorder 
            language={language}
            onSessionEnd={handleSessionEnd}
          />
        )}
      </main>
    </div>
  );
}

export default App;
