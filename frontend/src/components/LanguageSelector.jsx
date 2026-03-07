import React, { useState } from 'react';

export default function LanguageSelector({ onSelectLanguage, onNavInstructions = () => {}, onNavResources = () => {} }) {
  const [language, setLanguage] = useState('English');

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0B0F] text-slate-100">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#2A2A35] px-8 py-4 bg-[#0B0B0F]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-[#7c5cff] p-1.5 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-xl">rocket_launch</span>
          </div>
          <h2 className="text-slate-100 text-lg font-bold tracking-tight">PitchPilot AI</h2>
        </div>
        <nav className="flex items-center gap-8">
          <button onClick={onNavInstructions} className="text-[#A1A1AA] hover:text-white text-sm font-medium transition-colors">Instructions</button>
          <button onClick={onNavResources} className="text-[#A1A1AA] hover:text-white text-sm font-medium transition-colors">Resources</button>
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-[480px] w-full flex flex-col gap-10">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight text-white">PitchPilot AI</h1>
            <p className="text-slate-400 text-lg">AI pitch coach for builders</p>
          </div>

          <div className="bg-[#1C1C24] border border-[#2A2A35] rounded-xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#7c5cff]/5 to-transparent pointer-events-none"></div>
            <div className="relative space-y-8">
              <p className="text-slate-300 text-center leading-relaxed">
                Master your delivery with real-time AI feedback. Practice your technical pitch, refine your tone, and get ready for your next big demo.
              </p>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center justify-center gap-2">
                  Select Language
                </label>
                <div className="flex h-11 w-full items-center justify-center rounded-lg bg-[#0B0B0F] p-1 border border-[#2A2A35]">
                  <label className={`flex cursor-pointer h-full grow items-center justify-center rounded-md px-4 text-sm font-semibold transition-all ${language === 'English' ? 'bg-[#7c5cff] text-white' : 'text-slate-400'}`}>
                    <span>English</span>
                    <input className="invisible w-0" name="language-toggle" type="radio" value="English" checked={language === 'English'} onChange={() => setLanguage('English')} />
                  </label>
                  <label className={`flex cursor-pointer h-full grow items-center justify-center rounded-md px-4 text-sm font-semibold transition-all ${language === 'Español' ? 'bg-[#7c5cff] text-white' : 'text-slate-400'}`}>
                    <span>Español</span>
                    <input className="invisible w-0" name="language-toggle" type="radio" value="Español" checked={language === 'Español'} onChange={() => setLanguage('Español')} />
                  </label>
                </div>
              </div>

              <button
                onClick={() => onSelectLanguage(language === 'English' ? 'en' : 'es')}
                className="w-full bg-[#7c5cff] hover:bg-[#7c5cff]/90 text-white text-base font-bold h-12 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 group"
              >
                <span>Start Pitch Session</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex flex-wrap justify-center gap-3">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-500 bg-[#2A2A35]/30 px-3 py-1.5 rounded-md border border-[#2A2A35]">
                <span className="material-symbols-outlined text-sm">videocam</span>
                Camera required
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-500 bg-[#2A2A35]/30 px-3 py-1.5 rounded-md border border-[#2A2A35]">
                <span className="material-symbols-outlined text-sm">mic</span>
                Microphone required
              </div>
            </div>
            <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
              By starting, you allow PitchPilot to analyze your session. All data is processed securely and encrypted.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 border-t border-[#2A2A35]/50 text-center">
        <p className="text-slate-600 text-sm font-medium">Built for the next generation of technical founders.</p>
      </footer>
    </div>
  );
}
