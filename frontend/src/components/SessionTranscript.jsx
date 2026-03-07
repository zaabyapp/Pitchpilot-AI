import React, { useState } from 'react';

/**
 * Normalise a transcript entry coming from either:
 * - the backend { role: 'ai'|'user', text, timestamp }
 * - the legacy defaultTranscript format { role: 'ai'|'user', timestamp: string, text, highlights, tag }
 */
function normaliseEntry(entry, idx) {
  const role = entry.role ?? (entry.speaker === 'ai' ? 'ai' : 'user');
  const tsRaw = entry.timestamp;
  // Backend timestamps are ms numbers; legacy are strings like "00:32"
  let timestamp;
  if (typeof tsRaw === 'number') {
    const totalSec = Math.floor(tsRaw / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    timestamp = `${m}:${s}`;
  } else {
    timestamp = tsRaw ?? '00:00';
  }
  return { role, text: entry.text ?? '', timestamp, highlights: entry.highlights ?? [], tag: entry.tag ?? null, _key: idx };
}

function exportTranscriptTxt(sessionId, date, entries) {
  const lines = [`PitchPilot AI — Session Transcript`, `Session: ${sessionId}  |  Date: ${date}`, ``, `${'─'.repeat(60)}`];
  for (const e of entries) {
    const speaker = e.role === 'ai' ? 'PitchPilot AI' : 'You';
    lines.push(``, `[${e.timestamp}] ${speaker}:`, e.text);
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pitchpilot-transcript-${sessionId.replace('#', '')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function copyTranscriptToClipboard(entries) {
  const lines = [];
  for (const e of entries) {
    const speaker = e.role === 'ai' ? 'PitchPilot AI' : 'You';
    lines.push(`[${e.timestamp}] ${speaker}: ${e.text}`);
  }
  navigator.clipboard.writeText(lines.join('\n\n')).catch(() => {});
}

export default function SessionTranscript({
  sessionId = '#------',
  date = '',
  transcript = [],
  onBack = () => {},
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const normalisedTranscript = transcript.map(normaliseEntry);

  const handleCopy = () => {
    copyTranscriptToClipboard(normalisedTranscript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportTxt = () => {
    exportTranscriptTxt(sessionId, date, normalisedTranscript);
  };

  const filteredTranscript = normalisedTranscript.filter((msg) =>
    msg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderHighlightedText = (text, highlights) => {
    if (!highlights || highlights.length === 0) {
      return text;
    }

    let result = text;
    highlights.forEach((h) => {
      const regex = new RegExp(`(${h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      result = result.replace(
        regex,
        '<span class="bg-[#7c5cff]/15 border-b-2 border-[#7c5cff] text-white px-0.5">$1</span>'
      );
    });

    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  const getTagStyles = (type) => {
    switch (type) {
      case 'success':
        return 'text-[#10b981] bg-[#10b981]/10';
      case 'warning':
        return 'text-orange-400 bg-orange-400/10';
      case 'error':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-slate-400 bg-slate-400/10';
    }
  };

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-[#0B0B0F] text-slate-200 antialiased">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/5 px-8 py-3 bg-[#0B0B0F]/80 backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-[#7c5cff] size-8">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor" />
            </svg>
          </div>
          <h2 className="text-white text-lg font-bold tracking-tight">PitchPilot <span className="text-[#7c5cff]">AI</span></h2>
        </div>
        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-8">
            <button className="text-slate-400 text-sm font-medium hover:text-white transition-colors">Instructions</button>
            <button className="text-slate-400 text-sm font-medium hover:text-white transition-colors">Resources</button>
            <span className="text-white text-sm font-semibold border-b-2 border-[#7c5cff] py-4 -mb-4">Reporting</span>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Title bar */}
        <div className="shrink-0 px-8 py-6 border-b border-white/5 bg-[#0B0B0F]">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Full Session Transcript</h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                  Session ID: {sessionId} • {date}
                </p>
              </div>
            </div>
            <div className="relative w-full md:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transcript..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#7c5cff]/50 focus:border-[#7c5cff] transition-all placeholder:text-slate-600"
              />
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto bg-[#0D0D12]">
          <div className="max-w-4xl mx-auto px-8 py-12 space-y-10">
            {filteredTranscript.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                <div className="size-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-500 text-2xl">chat_bubble_outline</span>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-400 font-medium">No transcript available</p>
                  <p className="text-slate-600 text-sm">Complete a session to see the full conversation here.</p>
                </div>
              </div>
            )}
            {filteredTranscript.map((msg, idx) => (
              <div
                key={msg._key ?? idx}
                className={`flex flex-col gap-2 max-w-[85%] ${
                  msg.role === 'user' ? 'items-end ml-auto' : ''
                }`}
              >
                {/* Label + timestamp */}
                <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'flex-row' : ''}`}>
                  {msg.role === 'ai' ? (
                    <>
                      <span className="text-[10px] font-black text-[#7c5cff] uppercase tracking-widest">PitchPilot AI</span>
                      <span className="text-[10px] font-medium text-slate-600">{msg.timestamp}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-medium text-slate-600">{msg.timestamp}</span>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">You</span>
                    </>
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`p-5 rounded-2xl ${
                    msg.role === 'ai'
                      ? 'bg-white/[0.03] border border-white/5 rounded-tl-none'
                      : 'bg-[#7c5cff]/10 border border-[#7c5cff]/20 rounded-tr-none text-right'
                  }`}
                >
                  <p className={`text-sm leading-relaxed ${msg.role === 'ai' ? 'text-slate-300' : 'text-slate-200'}`}>
                    {renderHighlightedText(msg.text, msg.highlights)}
                  </p>

                  {/* Tag */}
                  {msg.tag && (
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getTagStyles(msg.tag.type)}`}>
                        {msg.tag.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* End divider */}
            <div className="flex justify-center py-4">
              <div className="h-12 w-px bg-gradient-to-b from-white/5 to-transparent"></div>
            </div>
            <div className="flex justify-center">
              <div className="bg-white/5 border border-white/10 rounded-full px-6 py-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">End of Session Transcript</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="shrink-0 border-t border-white/5 bg-[#0B0B0F]/80 backdrop-blur-md px-8 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-[#7c5cff]"></div>
                <span className="text-xs text-slate-400">Highlighted parts correspond to report insights</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                className="h-10 px-5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all border border-white/5 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleExportTxt}
                className="h-10 px-5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all border border-white/5 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Export TXT
              </button>
              <button
                onClick={onBack}
                className="h-10 px-5 bg-[#7c5cff] text-white text-xs font-bold rounded-xl hover:bg-[#7c5cff]/90 transition-all shadow-lg shadow-[#7c5cff]/20 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">analytics</span>
                Return to Report
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
