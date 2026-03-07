import React from 'react';

export default function NoFeedback({ onStartSession = () => {} }) {
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
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7c5cff]/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-[#7c5cff]/20 blur-3xl rounded-full scale-150 group-hover:bg-[#7c5cff]/30 transition-all"></div>
              <div className="relative size-32 bg-[#13131A]/60 backdrop-blur-2xl border border-white/10 rounded-3xl flex items-center justify-center" style={{ boxShadow: '0 0 30px -10px rgba(124, 92, 255, 0.3)' }}>
                <span 
                  className="material-symbols-outlined text-6xl text-[#7c5cff]/40 group-hover:text-[#7c5cff]/60 transition-all"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 200" }}
                >
                  analytics
                </span>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white tracking-tight">No Feedback Yet</h1>
            <p className="text-slate-400 text-lg leading-relaxed mx-auto max-w-xl">
              You haven't started a pitch simulation session yet. Run your first simulation and you will receive a detailed feedback report including:{' '}
              <span className="text-slate-300">pitch score</span>,{' '}
              <span className="text-slate-300">communication insights</span>,{' '}
              <span className="text-slate-300">business recommendations</span>,{' '}
              <span className="text-slate-300">presentation presence analysis</span>, and{' '}
              <span className="text-slate-300">actionable improvements</span>.
            </p>
          </div>

          {/* CTA */}
          <div className="space-y-4 pt-4">
            <button 
              onClick={onStartSession}
              className="h-14 px-10 bg-[#7c5cff] text-white text-base font-bold rounded-2xl hover:bg-[#7c5cff]/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-[#7c5cff]/25 flex items-center gap-3 mx-auto"
            >
              <span className="material-symbols-outlined">play_circle</span>
              Start Your Simulation
            </button>
            <p className="text-slate-500 text-sm font-medium">
              It only takes a minute to start practicing your pitch.
            </p>
          </div>
        </div>

        {/* Footer status */}
        <div className="absolute bottom-12 flex justify-center w-full">
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            AI Analysis Engine Ready • Status: Optimized
          </p>
        </div>
      </main>
    </div>
  );
}
