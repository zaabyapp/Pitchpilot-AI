import React from 'react';
import '../styles/LanguageSelector.css';

function LanguageSelector({ onSelectLanguage }) {
  return (
    <div className="language-selector">
      <h2>Select Language / Selecciona Idioma</h2>
      <p>Choose your preferred language for the pitch simulation</p>
      
      <div className="language-buttons">
        <button 
          className="language-btn english"
          onClick={() => onSelectLanguage('en')}
        >
          🇬🇧 English
        </button>
        
        <button 
          className="language-btn spanish"
          onClick={() => onSelectLanguage('es')}
        >
          🇲🇽 Español
        </button>
      </div>
    </div>
  );
}

export default LanguageSelector;
