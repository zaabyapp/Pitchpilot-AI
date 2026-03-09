import React, { useState } from 'react';
import Header from './Header';

const TRANSLATIONS = {
  en: {
    title: 'Full Session Transcript',
    sessionIdLabel: 'Session ID',
    searchPlaceholder: 'Search transcript...',
    aiLabel: 'PitchPilot AI',
    userLabel: 'You',
    noTranscript: 'No transcript available',
    noTranscriptSub: 'Complete a session to see the full conversation here.',
    legend: 'Highlighted parts correspond to report insights',
    copy: 'Copy',
    copied: 'Copied!',
    exportTxt: 'Export TXT',
    returnToReport: 'Return to Report',
    endOfTranscript: 'End of Session Transcript',
  },
  es: {
    title: 'Transcripción Completa de Sesión',
    sessionIdLabel: 'ID de Sesión',
    searchPlaceholder: 'Buscar en transcripción...',
    aiLabel: 'PitchPilot AI',
    userLabel: 'Tú',
    noTranscript: 'No hay transcripción disponible',
    noTranscriptSub: 'Completa una sesión para ver la conversación completa aquí.',
    legend: 'Las partes resaltadas corresponden a los insights del informe',
    copy: 'Copiar',
    copied: '¡Copiado!',
    exportTxt: 'Exportar TXT',
    returnToReport: 'Volver al Informe',
    endOfTranscript: 'Fin de la Transcripción',
  },
};

/**
 * Normalise a transcript entry from either backend or legacy format.
 */
function normaliseEntry(entry, idx) {
  const role = entry.role ?? (entry.speaker === 'ai' ? 'ai' : 'user');
  const tsRaw = entry.timestamp;
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

/**
 * Group consecutive entries from the same speaker into a single bubble.
 * Preserves the first timestamp and accumulates text with a space separator.
 */
function groupBySpeaker(entries) {
  const groups = [];
  for (const entry of entries) {
    const last = groups[groups.length - 1];
    if (last && last.role === entry.role) {
      last.text = last.text + ' ' + entry.text;
      // merge highlights if any
      if (entry.highlights?.length) {
        last.highlights = [...last.highlights, ...entry.highlights];
      }
    } else {
      groups.push({ ...entry, highlights: [...(entry.highlights ?? [])] });
    }
  }
  return groups;
}

function exportTranscriptTxt(sessionId, date, entries, t) {
  const lines = [`PitchPilot AI — ${t.title}`, `${t.sessionIdLabel}: ${sessionId}  |  Date: ${date}`, '', '─'.repeat(60)];
  for (const e of entries) {
    const speaker = e.role === 'ai' ? t.aiLabel : t.userLabel;
    lines.push('', `[${e.timestamp}] ${speaker}:`, e.text);
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pitchpilot-transcript-${sessionId.replace('#', '')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function copyTranscriptToClipboard(entries, t) {
  const lines = [];
  for (const e of entries) {
    const speaker = e.role === 'ai' ? t.aiLabel : t.userLabel;
    lines.push(`[${e.timestamp}] ${speaker}: ${e.text}`);
  }
  navigator.clipboard.writeText(lines.join('\n\n')).catch(() => {});
}

export default function SessionTranscript({
  sessionId = '#------',
  date = '',
  transcript = [],
  language = 'en',
  onBack = () => {},
  onNavInstructions = () => {},
  onNavResources = () => {},
  onNavReporting = () => {},
  onStartSession = () => {},
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const t = TRANSLATIONS[language] ?? TRANSLATIONS.en;

  const normalisedTranscript = groupBySpeaker(transcript.map(normaliseEntry));

  const handleCopy = () => {
    copyTranscriptToClipboard(normalisedTranscript, t);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportTxt = () => {
    exportTranscriptTxt(sessionId, date, normalisedTranscript, t);
  };

  const filteredTranscript = normalisedTranscript.filter((msg) =>
    msg.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderHighlightedText = (text, highlights) => {
    if (!highlights || highlights.length === 0) return text;
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
      case 'success': return 'text-[#10b981] bg-[#10b981]/10';
      case 'warning': return 'text-orange-400 bg-orange-400/10';
      case 'error': return 'text-red-400 bg-red-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-[#0B0B0F] text-slate-200 antialiased">
      <Header
        activePage="reporting"
        onNavInstructions={onNavInstructions}
        onNavResources={onNavResources}
        onNavReporting={onNavReporting}
        onStartSession={onStartSession}
      />

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
                <h1 className="text-2xl font-black text-white tracking-tight">{t.title}</h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                  {t.sessionIdLabel}: {sessionId} • {date}
                </p>
              </div>
            </div>
            <div className="relative w-full md:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
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
                  <p className="text-slate-400 font-medium">{t.noTranscript}</p>
                  <p className="text-slate-600 text-sm">{t.noTranscriptSub}</p>
                </div>
              </div>
            )}
            {filteredTranscript.map((msg, idx) => (
              <div
                key={msg._key ?? idx}
                className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end ml-auto' : ''}`}
              >
                {/* Label + timestamp */}
                <div className={`flex items-center gap-2 mb-1 ${msg.role === 'user' ? 'flex-row' : ''}`}>
                  {msg.role === 'ai' ? (
                    <>
                      <span className="text-[10px] font-black text-[#7c5cff] uppercase tracking-widest">{t.aiLabel}</span>
                      <span className="text-[10px] font-medium text-slate-600">{msg.timestamp}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] font-medium text-slate-600">{msg.timestamp}</span>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">{t.userLabel}</span>
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
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{t.endOfTranscript}</p>
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
                <span className="text-xs text-slate-400">{t.legend}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                className="h-10 px-5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all border border-white/5 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
                {copied ? t.copied : t.copy}
              </button>
              <button
                onClick={handleExportTxt}
                className="h-10 px-5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-all border border-white/5 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                {t.exportTxt}
              </button>
              <button
                onClick={onBack}
                className="h-10 px-5 bg-[#7c5cff] text-white text-xs font-bold rounded-xl hover:bg-[#7c5cff]/90 transition-all shadow-lg shadow-[#7c5cff]/20 flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">analytics</span>
                {t.returnToReport}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
