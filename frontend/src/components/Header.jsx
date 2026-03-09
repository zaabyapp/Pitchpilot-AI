import React from 'react';

const LOGO_PATH =
  'M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z';

const NAV_ITEMS = [
  { id: 'instructions', label: 'Instructions' },
  { id: 'resources', label: 'Resources' },
  { id: 'reporting', label: 'Reporting' },
];

/**
 * Shared header used across all screens.
 *
 * Props:
 *   activePage  – 'instructions' | 'resources' | 'reporting' | 'session'
 *   onNavInstructions / onNavResources / onNavReporting
 *   onStartSession – called by the CTA button
 *   ctaLabel    – button label, default 'Start Practice'
 */
export default function Header({
  activePage = 'instructions',
  onNavInstructions = () => {},
  onNavResources = () => {},
  onNavReporting = () => {},
  onStartSession = () => {},
  language = 'en',
}) {
  const ctaLabel = language === 'es' ? 'Iniciar práctica' : 'Start Practice';
  const onClick = { instructions: onNavInstructions, resources: onNavResources, reporting: onNavReporting };

  return (
    <header className="border-b border-white/5 bg-[#0B0B0F]/80 backdrop-blur-md sticky top-0 z-50 shrink-0">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-stretch justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="text-[#7C5CFF] size-7">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d={LOGO_PATH} fill="currentColor" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            PitchPilot <span className="text-[#7C5CFF]">AI</span>
          </span>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-stretch gap-8">
          {NAV_ITEMS.map(({ id, label }) =>
            activePage === id ? (
              <span
                key={id}
                className="flex items-center border-b-2 border-[#7C5CFF] text-sm font-semibold text-white"
              >
                {label}
              </span>
            ) : (
              <button
                key={id}
                onClick={onClick[id]}
                className="flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                {label}
              </button>
            )
          )}
          <div className="flex items-center ml-2">
            <button
              onClick={onStartSession}
              className="bg-[#7C5CFF] hover:bg-[#7C5CFF]/90 text-white px-5 py-2 rounded-md text-sm font-semibold transition-all shadow-lg shadow-[#7C5CFF]/20"
            >
              {ctaLabel}
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
