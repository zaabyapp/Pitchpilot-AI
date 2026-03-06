import React, { useState } from 'react';
import '../styles/ChatDisplay.css';

function ChatDisplay({ language }) {
  const [messages, setMessages] = useState([
    {
      role: 'agent',
      content: language === 'en' 
        ? 'Who are you pitching to today?'
        : '¿A quién le estás haciendo pitch hoy?',
      timestamp: new Date()
    }
  ]);

  return (
    <div className="chat-display">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message message-${msg.role}`}>
            <p>{msg.content}</p>
            <span className="timestamp">
              {msg.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatDisplay;
