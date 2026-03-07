import React, { useState } from 'react';
import LanguageSelector from './components/LanguageSelector';
import PitchRecorder from './components/PitchRecorder';
import FeedbackReport from './components/FeedbackReport';
import NoFeedback from './components/NoFeedback';
import SessionTranscript from './components/SessionTranscript';
import BuilderResources from './components/BuilderResources';
import ResourceDetail from './components/ResourceDetail';
import Instructions from './components/Instructions';

function App() {
  const [screen, setScreen] = useState('landing');
  const [language, setLanguage] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [hasCompletedSession, setHasCompletedSession] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [sessionData, setSessionData] = useState(null); // { transcript, questionsAnswered, ... }

  const handleStartSession = () => {
    setScreen('landing');
    setLanguage(null);
  };

  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    const id = `#${Date.now().toString(36).toUpperCase()}`;
    setSessionId(id);
    setScreen('session');
  };

  const handleSessionEnd = (data) => {
    setSessionData(data);
    setHasCompletedSession(true);
    setScreen('reporting');
  };

  const handleNewSession = () => {
    handleStartSession();
  };

  const handleViewTranscript = () => {
    setScreen('transcript');
  };

  const handleBackFromTranscript = () => {
    setScreen('reporting');
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
        onStartSession={handleStartSession}
        onSelectResource={handleSelectResource}
        onNavInstructions={navInstructions}
        onNavReporting={navReporting}
      />
    );
  }

  if (screen === 'transcript') {
    return (
      <SessionTranscript
        sessionId={sessionId}
        date={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        transcript={sessionData?.transcript ?? []}
        onBack={handleBackFromTranscript}
      />
    );
  }

  if (screen === 'reporting') {
    if (hasCompletedSession) {
      return (
        <FeedbackReport
          sessionId={sessionId}
          language={language}
          sessionData={sessionData}
          onViewTranscript={handleViewTranscript}
          onNewSession={handleNewSession}
          onNavInstructions={navInstructions}
          onNavResources={navResources}
        />
      );
    }
    return (
      <NoFeedback
        onStartSession={handleStartSession}
        onNavInstructions={navInstructions}
        onNavResources={navResources}
      />
    );
  }

  if (screen === 'session') {
    return (
      <PitchRecorder
        language={language}
        sessionId={sessionId}
        onSessionEnd={handleSessionEnd}
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
