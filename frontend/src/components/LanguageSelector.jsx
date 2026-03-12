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
          <button onClick={onNavInstructions} className="text-[#A1A1AA] hover:text-white text-sm font-medium transition-colors">
            {isEs ? 'Instrucciones' : 'Instructions'}
          </button>
          <button onClick={onNavResources} className="text-[#A1A1AA] hover:text-white text-sm font-medium transition-colors">
            {isEs ? 'Recursos' : 'Resources'}
          </button>
        </nav>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-[480px] w-full flex flex-col gap-10">
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight text-white">PitchPilot AI</h1>
            <p className="text-slate-400 text-lg">{isEs ? 'Coach de pitch con IA para founders' : 'AI pitch coach for builders'}</p>
          </div>

          <div className="bg-[#1C1C24] border border-[#2A2A35] rounded-xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#7c5cff]/5 to-transparent pointer-events-none" />

            {step === 'language' && (
              <div className="relative space-y-8">
                <p className="text-slate-300 text-center leading-relaxed" style={{ minHeight: '4.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isEs
                    ? 'Domina tu presentación con retroalimentación de IA en tiempo real. Practica tu pitch técnico y prepárate para tu próxima gran demo.'
                    : 'Master your delivery with real-time AI feedback. Practice your technical pitch, refine your tone, and get ready for your next big demo.'}
                </p>

                <div className="space-y-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500 text-center">
                    {isEs ? 'Selecciona idioma' : 'Select Language'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', width: '296px', margin: '0 auto' }}>
                    {[{ val: 'English', label: 'English' }, { val: 'Español', label: 'Español' }].map(({ val, label }) => (
                      <button
                        key={val}
                        onClick={() => setLanguage(val)}
                        style={{
                          width: '140px',
                          height: '80px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '12px',
                          border: `2px solid ${language === val ? '#7c5cff' : '#2A2A35'}`,
                          background: language === val ? 'rgba(124,92,255,0.12)' : 'rgba(11,11,15,0.8)',
                          color: language === val ? '#fff' : '#71717a',
                          fontWeight: '700',
                          fontSize: '15px',
                          cursor: 'pointer',
                          transition: 'border-color 0.15s, background 0.15s, color 0.15s',
                          flexShrink: 0,
                        }}
                      >
                        {label}
                      </button>
                    ))}
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

          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex flex-wrap justify-center gap-3">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-500 bg-[#2A2A35]/30 px-3 py-1.5 rounded-md border border-[#2A2A35]">
                <span className="material-symbols-outlined text-sm">videocam</span>
                {isEs ? 'Cámara requerida' : 'Camera required'}
              </div>
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-slate-500 bg-[#2A2A35]/30 px-3 py-1.5 rounded-md border border-[#2A2A35]">
                <span className="material-symbols-outlined text-sm">mic</span>
                {isEs ? 'Micrófono requerido' : 'Microphone required'}
              </div>
            </div>
            <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
              {isEs
                ? 'Al comenzar, permites a PitchPilot analizar tu sesión. Todos los datos se procesan de forma segura y encriptada.'
                : 'By starting, you allow PitchPilot to analyze your session. All data is processed securely and encrypted.'}
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-8 border-t border-[#2A2A35]/50 text-center">
        <p className="text-slate-600 text-sm font-medium">
          {isEs ? 'Construido para la próxima generación de founders técnicos.' : 'Built for the next generation of technical founders.'}
        </p>
      </footer>
    </div>
  );
}
