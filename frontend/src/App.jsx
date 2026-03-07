import React, { useState } from 'react';
import LanguageSelector from './components/LanguageSelector';
import PitchRecorder from './components/PitchRecorder';
import FeedbackReport from './components/FeedbackReport';
import NoFeedback from './components/NoFeedback';
import SessionTranscript from './components/SessionTranscript';
import BuilderResources from './components/BuilderResources';
import ResourceDetail from './components/ResourceDetail';

function App() {
  const [language, setLanguage] = useState(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showResources, setShowResources] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [hasCompletedSession, setHasCompletedSession] = useState(false);

  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    setSessionStarted(true);
    setShowReport(false);
    setShowTranscript(false);
    setShowResources(false);
    setSelectedResource(null);
    setSessionId(`#${Date.now().toString(36).toUpperCase()}`);
  };

  const handleSessionEnd = () => {
    setSessionStarted(false);
    setShowReport(true);
    setHasCompletedSession(true);
  };

  const handleNewSession = () => {
    setLanguage(null);
    setSessionStarted(false);
    setShowReport(false);
    setShowTranscript(false);
    setShowResources(false);
    setSelectedResource(null);
    setSessionId(null);
  };

  const handleStartSession = () => {
    setShowReport(false);
    setShowTranscript(false);
    setShowResources(false);
    setSelectedResource(null);
    setLanguage(null);
    setSessionStarted(false);
  };

  const handleViewTranscript = () => {
    setShowTranscript(true);
  };

  const handleBackFromTranscript = () => {
    setShowTranscript(false);
  };

  const handleExportTranscript = () => {
    console.log('Export transcript clicked');
  };

  const handleSelectResource = (resource) => {
    setSelectedResource(resource);
  };

  const handleBackFromResourceDetail = () => {
    setSelectedResource(null);
  };

  // Show resource detail
  if (showResources && selectedResource) {
    return (
      <ResourceDetail
        resource={selectedResource}
        onBack={handleBackFromResourceDetail}
        onStartSession={handleStartSession}
      />
    );
  }

  // Show resources list
  if (showResources) {
    return (
      <BuilderResources
        onStartSession={handleStartSession}
        onSelectResource={handleSelectResource}
      />
    );
  }

  // Show transcript view
  if (showTranscript) {
    return (
      <SessionTranscript
        sessionId={sessionId}
        date={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        onBack={handleBackFromTranscript}
        onExport={handleExportTranscript}
      />
    );
  }

  // Show report or no-feedback view
  if (showReport) {
    if (hasCompletedSession) {
      return (
        <FeedbackReport
          sessionId={sessionId}
          language={language}
          onViewTranscript={handleViewTranscript}
          onNewSession={handleNewSession}
        />
      );
    } else {
      return (
        <NoFeedback onStartSession={handleStartSession} />
      );
    }
  }

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
