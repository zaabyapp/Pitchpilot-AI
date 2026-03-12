import React, { useState } from 'react';
import LanguageSelector from './components/LanguageSelector';
import PitchRecorder from './components/PitchRecorder';
import FeedbackReport from './components/FeedbackReport';
import NoFeedback from './components/NoFeedback';
import BuilderResources from './components/BuilderResources';
import ResourceDetail from './components/ResourceDetail';
import Instructions from './components/Instructions';

function App() {
  const [screen, setScreen] = useState('landing');
  const [language, setLanguage] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sessionMode, setSessionMode] = useState('practice'); // 'practice' | 'chat'
  const [hasCompletedSession, setHasCompletedSession] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [sessionData, setSessionData] = useState(null); // { transcript, questionsAnswered, ... }

  const handleStartSession = () => {
    setScreen('landing');
    setLanguage(null);
  };

  const handleLanguageSelect = ({ language: lang, mode }) => {
    setLanguage(lang);
    setSessionMode(mode ?? 'practice');
    const id = `#${Date.now().toString(36).toUpperCase()}`;
    setSessionId(id);
    setScreen('session');
  };

  const handleReset = () => {
    setScreen('landing');
    setLanguage(null);
    setSessionMode('practice');
  };

  const handleSessionEnd = ({ report, transcript, sessionId: sid, language: lang, questionsAnswered, endedAt }) => {
    setSessionData({ report, transcript, questionsAnswered, endedAt });
    if (sid) setSessionId(sid);
    if (lang) setLanguage(lang);
    setHasCompletedSession(true);
    setScreen('reporting');
  };

  const handleNewSession = () => {
    handleStartSession();
  };

  const handleSelectResource = (resource) => {
    setSelectedResource(resource);
    setScreen('resource-detail');
  };

  const handleBackFromResourceDetail = () => {
    setScreen('resources');
  };

  const navInstructions = () => setScreen('instructions');
  const navResources = () => setScreen('resources');
  const navReporting = () => setScreen('reporting');

  if (screen === 'instructions') {
    return (
      <Instructions
        language={language ?? 'en'}
        onStartSession={handleStartSession}
        onNavResources={navResources}
        onNavReporting={navReporting}
      />
    );
  }

  if (screen === 'resource-detail') {
    return (
      <ResourceDetail
        resource={selectedResource}
        language={language ?? 'en'}
        onBack={handleBackFromResourceDetail}
        onStartSession={handleStartSession}
        onNavInstructions={navInstructions}
        onNavReporting={navReporting}
      />
    );
  }

  if (screen === 'resources') {
    return (
      <BuilderResources
        language={language ?? 'en'}
        onBack={navInstructions}
        onStartSession={handleStartSession}
        onSelectResource={handleSelectResource}
        onNavInstructions={navInstructions}
        onNavReporting={navReporting}
      />
    );
  }

  if (screen === 'reporting') {
    if (hasCompletedSession) {
      return (
        <FeedbackReport
          sessionId={sessionId}
          language={language ?? 'en'}
          feedbackData={sessionData?.report ?? null}
          sessionData={sessionData}
          onNewSession={handleNewSession}
          onNavInstructions={navInstructions}
          onNavResources={navResources}
          onNavReporting={navReporting}
        />
      );
    }
    return (
      <NoFeedback
        onStartSession={handleStartSession}
        onNavInstructions={navInstructions}
        onNavResources={navResources}
        onNavReporting={navReporting}
      />
    );
  }

  if (screen === 'session') {
    return (
      <PitchRecorder
        language={language}
        sessionId={sessionId}
        mode={sessionMode}
        onSessionEnd={handleSessionEnd}
        onReset={handleReset}
      />
    );
  }

  // landing
  return (
    <LanguageSelector
      onSelectLanguage={handleLanguageSelect}
      onNavInstructions={navInstructions}
      onNavResources={navResources}
    />
  );
}

export default App;
