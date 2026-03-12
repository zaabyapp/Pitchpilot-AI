import React, { useState } from 'react';

export default function LanguageSelector({ onSelectLanguage, onNavInstructions = () => {}, onNavResources = () => {} }) {
  const [language, setLanguage] = useState('English');
  const [step, setStep] = useState('language'); // 'language' | 'mode'

  const isEs = language === 'Español';

  const handleLanguageNext = () => setStep('mode');

  const handleModeSelect = (mode) => {
    onSelectLanguage({ language: isEs ? 'es' : 'en', mode });
  };

  return (
    <div className="h-screen max-h-screen flex flex-col bg-[#0B0B0F] text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#2A2A35] px-8 py-3 bg-[#0B0B0F]/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-[#7c5cff] p-1.5 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-xl">rocket_launch</span>
          </div>
          <h2 className="text-slate-100 text-lg font-bold tracking-tight">PitchPilot AI</h2>
        </div>
        <nav className="flex items-center gap-8">
          <button onClick={onNavInstructions} className="text-[#A1A1AA] hover:text-white text-sm font-medium transition-colors">
            {isEs ? 'Instrucciones' : 'Instructions'}
          </button>
          <button onClick={onNavResources} className="text-[#A1A1AA] hover:text-white text-sm font-medium transition-colors">
            {isEs ? 'Recursos' : 'Resources'}
          </button>
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center py-4 px-6 overflow-hidden">
        <div className="w-[480px] mx-auto flex flex-col gap-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">PitchPilot AI</h1>
            <p className="text-slate-400 text-base">{isEs ? 'Coach de pitch con IA para founders' : 'AI pitch coach for builders'}</p>
          </div>

          <div className="bg-[#1C1C24] border border-[#2A2A35] rounded-xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#7c5cff]/5 to-transparent pointer-events-none" />

            {step === 'language' && (
              <div className="relative space-y-8">
                <p className="text-slate-300 text-center leading-relaxed">
                  {isEs
                    ? 'Domina tu presentación con retroalimentación de IA en tiempo real. Practica tu pitch técnico y prepárate para tu próxima gran demo.'
                    : 'Master your delivery with real-time AI feedback. Practice your technical pitch, refine your tone, and get ready for your next big demo.'}
                </p>

                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center justify-center gap-2">
                    {isEs ? 'Selecciona idioma' : 'Select Language'}
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
                  onClick={handleLanguageNext}
                  className="w-full bg-[#7c5cff] hover:bg-[#7c5cff]/90 text-white text-base font-bold h-12 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 group"
                >
                  <span>{isEs ? 'Continuar' : 'Continue'}</span>
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </div>
            )}

            {step === 'mode' && (
              <div className="relative space-y-6">
                <div className="text-center space-y-1">
                  <button
                    onClick={() => setStep('language')}
                    className="text-slate-500 hover:text-slate-300 text-xs flex items-center gap-1 mb-4 mx-auto transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    {isEs ? 'Volver' : 'Back'}
                  </button>
                  <p className="text-white font-bold text-lg">
                    {isEs ? '¿Qué quieres hacer hoy?' : 'What would you like to do today?'}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', width: '296px', margin: '0 auto' }}>
                  {[
                    { mode: 'practice', icon: 'mic', color: '#7c5cff', label: isEs ? 'Practicar' : 'Practice' },
                    { mode: 'chat', icon: 'psychology', color: '#34d399', label: isEs ? 'Coaching' : 'Chat' },
                  ].map(({ mode, icon, color, label }) => (
                    <button
                      key={mode}
                      onClick={() => handleModeSelect(mode)}
                      style={{
                        width: '140px',
                        height: '80px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        borderRadius: '12px',
                        border: `2px solid ${color}40`,
                        background: `${color}0d`,
                        color: '#fff',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, background 0.15s',
                        flexShrink: 0,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}99`; e.currentTarget.style.background = `${color}1a`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.background = `${color}0d`; }}
                    >
                      <span className="material-symbols-outlined" style={{ color, fontSize: '24px' }}>{icon}</span>
                      <span style={{ color: '#e2e8f0' }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex flex-wrap justify-center gap-2">
              <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-[#2A2A35]/30 px-2.5 py-1 rounded-md border border-[#2A2A35]">
                <span className="material-symbols-outlined text-xs">videocam</span>
                {isEs ? 'Cámara requerida' : 'Camera required'}
              </div>
              <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-[#2A2A35]/30 px-2.5 py-1 rounded-md border border-[#2A2A35]">
                <span className="material-symbols-outlined text-xs">mic</span>
                {isEs ? 'Micrófono requerido' : 'Microphone required'}
              </div>
            </div>
            <p className="text-slate-600 max-w-[480px] leading-tight text-center" style={{ fontSize: '13px' }}>
              {isEs
                ? 'Al comenzar, permites a PitchPilot analizar tu sesión. Todos los datos se procesan de forma segura y encriptada.'
                : 'By starting, you allow PitchPilot to analyze your session. All data is processed securely and encrypted.'}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-3 px-8 border-t border-[#2A2A35]/50 text-center shrink-0">
        <p className="text-slate-600 text-xs font-medium">
          {isEs ? 'Construido para la próxima generación de founders técnicos.' : 'Built for the next generation of technical founders.'}
        </p>
      </footer>
    </div>
  );
}
