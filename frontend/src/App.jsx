import React, { useState } from 'react';
import LanguageSelector from './components/LanguageSelector';
import PitchRecorder from './components/PitchRecorder';

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
    <>
      {!sessionStarted ? (
        <LanguageSelector onSelectLanguage={handleLanguageSelect} />
      ) : (
        <PitchRecorder 
          language={language}
          onSessionEnd={handleSessionEnd}
        />
      )}
    </>
  );
}

export default App;
