import React from 'react';
import Header from './Header';

const TRANSLATIONS = {
  en: {
    noReport: 'Report not available',
    noReportSub: 'Complete a pitch simulation to generate your personalized feedback report.',
    startSession: 'Start a Session',
    title: 'Pitch Performance Report',
    subtitle: 'AI-generated analysis of your session',
    level: 'Level',
    levels: { 'Strong Pitch': 'Strong Pitch', 'Good Pitch': 'Good Pitch', 'Needs Work': 'Needs Work' },
    scoreReady: 'Your pitch analysis is ready',
    exportReport: 'Export Report',
    shareReport: 'Share Report',
    shareTitle: 'PitchPilot AI Report',
    shareText: (id, s) => `Session ${id} — Score: ${s}/100`,
    questionsAnswered: (n) => `${n} question${n !== 1 ? 's' : ''} answered`,
    whatWentWell: 'What you did well',
    deliveryMetrics: 'Delivery Metrics',
    metricLabels: { clarity: 'Clarity', energy: 'Energy', pacing: 'Pacing' },
    voiceAnalysis: 'Voice Analysis',
    wpm: 'Words Per Minute',
    sentimentBalance: 'Sentiment Balance',
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
    actionItems: 'Action Items',
    actionItemsSub: 'Your next steps to improve this pitch',
    communicationFocus: 'Communication Focus',
    businessFocus: 'Business Focus',
    audienceImpact: 'Audience Impact',
    session: 'Session',
    aiEngine: 'AI Analysis Engine',
    newSession: 'New Session',
  },
  es: {
    noReport: 'Informe no disponible',
    noReportSub: 'Completa una simulación de pitch para generar tu informe personalizado.',
    startSession: 'Iniciar Sesión',
    title: 'Informe de Desempeño del Pitch',
    subtitle: 'Análisis generado por IA de tu sesión',
    level: 'Nivel',
    levels: { 'Strong Pitch': 'Pitch Sólido', 'Good Pitch': 'Buen Pitch', 'Needs Work': 'Necesita Mejorar' },
    scoreReady: 'Tu análisis del pitch está listo',
    exportReport: 'Exportar Informe',
    shareReport: 'Compartir Informe',
    shareTitle: 'Informe PitchPilot AI',
    shareText: (id, s) => `Sesión ${id} — Puntaje: ${s}/100`,
    questionsAnswered: (n) => `${n} pregunta${n !== 1 ? 's' : ''} respondida${n !== 1 ? 's' : ''}`,
    whatWentWell: 'Lo que hiciste bien',
    deliveryMetrics: 'Métricas de Presentación',
    metricLabels: { clarity: 'Claridad', energy: 'Energía', pacing: 'Ritmo' },
    voiceAnalysis: 'Análisis de Voz',
    wpm: 'Palabras por Minuto',
    sentimentBalance: 'Balance de Sentimiento',
    positive: 'Positivo',
    neutral: 'Neutral',
    negative: 'Negativo',
    actionItems: 'Elementos de Acción',
    actionItemsSub: 'Tus próximos pasos para mejorar este pitch',
    communicationFocus: 'Enfoque en Comunicación',
    businessFocus: 'Enfoque en Negocios',
    audienceImpact: 'Impacto en la Audiencia',
    session: 'Sesión',
    aiEngine: 'Motor de Análisis IA',
    newSession: 'Nueva Sesión',
  },
};

export default function FeedbackReport({
  sessionId = '#------',
  language = 'en',
  feedbackData = null,
  sessionData = null,
  onNewSession = () => {},
  onNavInstructions = () => {},
  onNavResources = () => {},
  onNavReporting = () => {},
}) {
  const t = TRANSLATIONS[language] ?? TRANSLATIONS.en;

  if (!feedbackData) {
    return (
      <div className="relative flex flex-col min-h-screen overflow-hidden bg-[#0B0B0F] text-slate-200 antialiased">
        <Header
          activePage="reporting"
          onNavInstructions={onNavInstructions}
          onNavResources={onNavResources}
          onNavReporting={onNavReporting}
          onStartSession={onNewSession}
          ctaLabel={t.newSession}
        />
        <main className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-8">
          <div className="size-16 rounded-full bg-[#7c5cff]/10 border border-[#7c5cff]/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#7c5cff] text-2xl">analytics</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">{t.noReport}</h2>
            <p className="text-slate-400 text-sm max-w-sm">{t.noReportSub}</p>
          </div>
          <button onClick={onNewSession} className="bg-[#7C5CFF] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#7C5CFF]/90 transition-all">
            {t.startSession}
          </button>
        </main>
      </div>
    );
  }

  const {
    score,
    level,
    summary,
    whatWentWell,
    deliveryMetrics,
    voiceAnalysis,
    actionItems,
  } = feedbackData;

  const circumference = 2 * Math.PI * 58;
  const strokeDashoffset = circumference - ((score ?? 0) / 100) * circumference;

  // Parse sentiment values — support both new structured format and legacy string format
  let sentimentPositive = voiceAnalysis?.sentimentPositive;
  let sentimentNeutral = voiceAnalysis?.sentimentNeutral;
  let sentimentNegative = voiceAnalysis?.sentimentNegative;
  if (sentimentPositive == null && voiceAnalysis?.sentiment) {
    const m = voiceAnalysis.sentiment.match(/(\d+).*?(\d+).*?(\d+)/);
    if (m) {
      sentimentPositive = parseInt(m[1], 10);
      sentimentNeutral = parseInt(m[2], 10);
      sentimentNegative = parseInt(m[3], 10);
    }
  }

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden bg-[#0B0B0F] text-slate-200 antialiased">
      <Header
        activePage="reporting"
        onNavInstructions={onNavInstructions}
        onNavResources={onNavResources}
        onNavReporting={onNavReporting}
        onStartSession={onNewSession}
        ctaLabel={t.newSession}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">
          {/* Title Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/5">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight mb-1">{t.title}</h1>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#7c5cff] animate-pulse"></span>
                <p className="text-slate-400 font-medium">{t.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t.session}: {sessionId}</span>
            </div>
          </div>

          {/* Score Card */}
          <div className="bg-[#13131A]/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-10">
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle className="text-white/5" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeWidth="8" />
                <circle className="text-[#7c5cff]" cx="64" cy="64" fill="transparent" r="58" stroke="currentColor" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeWidth="8" />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-black text-white">{score ?? '—'}</span>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter">/ 100</span>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 mb-4" style={{ boxShadow: '0 0 25px -5px rgba(16, 185, 129, 0.2)' }}>
                <span className="material-symbols-outlined text-sm">verified</span>
                <span className="text-xs font-bold uppercase tracking-wider">{t.level}: {t.levels[level] ?? level}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{t.scoreReady}</h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">{summary}</p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 h-11 px-6 bg-[#7c5cff] text-white text-sm font-bold rounded-xl hover:bg-[#7c5cff]/90 transition-all shadow-lg shadow-[#7c5cff]/20"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                {t.exportReport}
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: t.shareTitle, text: t.shareText(sessionId, score), url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href).catch(() => {});
                  }
                }}
                className="flex items-center justify-center gap-2 h-11 px-6 bg-white/5 text-white text-sm font-bold rounded-xl hover:bg-white/10 transition-all border border-white/5"
              >
                <span className="material-symbols-outlined text-sm">share</span>
                {t.shareReport}
              </button>
              {sessionData?.questionsAnswered != null && (
                <div className="flex items-center justify-center gap-2 h-11 px-6 bg-white/5 border border-white/5 rounded-xl">
                  <span className="material-symbols-outlined text-sm text-[#7c5cff]">quiz</span>
                  <span className="text-xs text-slate-400">{t.questionsAnswered(sessionData.questionsAnswered)}</span>
                </div>
              )}
            </div>
          </div>

          {/* What You Did Well */}
          {whatWentWell?.length > 0 && (
            <div className="bg-[#13131A]/60 backdrop-blur-2xl border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-lg text-white">{t.whatWentWell}</h3>
                <span className="material-symbols-outlined text-[#10b981]">task_alt</span>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {whatWentWell.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 bg-[#10b981]/5 border border-[#10b981]/10 rounded-xl">
                    <span className="material-symbols-outlined text-[#10b981] text-lg">check_circle</span>
                    <p className="text-sm text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Delivery Metrics */}
            {deliveryMetrics && (
              <div className="bg-[#13131A]/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-6">
                <h3 className="font-bold text-sm mb-6 flex items-center gap-2 text-white">
                  <span className="material-symbols-outlined text-[#7c5cff] text-lg">mic_external_on</span>
                  {t.deliveryMetrics}
                </h3>
                <div className="space-y-5">
                  {Object.entries(deliveryMetrics).map(([key, value]) => (
                    <div key={key} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-slate-400">{t.metricLabels[key] ?? key}</span>
                        <span className="text-white">{value}%</span>
                      </div>
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-[#7c5cff]" style={{ width: `${value}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Analysis */}
            {voiceAnalysis && (
              <div className="bg-[#13131A]/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-6">
                <h3 className="font-bold text-sm mb-6 flex items-center gap-2 text-white">
                  <span className="material-symbols-outlined text-[#7c5cff] text-lg">analytics</span>
                  {t.voiceAnalysis}
                </h3>
                <div className="space-y-5">
                  {/* Words Per Minute */}
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">{t.wpm}</span>
                    <div className="text-xl font-bold text-white">{voiceAnalysis.wpm}</div>
                  </div>

                  {/* Sentiment Balance */}
                  {sentimentPositive != null && (
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-3">{t.sentimentBalance}</span>
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-[#10b981] w-16 uppercase tracking-wider">{t.positive}</span>
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-[#10b981] rounded-full" style={{ width: `${sentimentPositive}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-white w-10 text-right">{sentimentPositive}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400 w-16 uppercase tracking-wider">{t.neutral}</span>
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-400 rounded-full" style={{ width: `${sentimentNeutral}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-white w-10 text-right">{sentimentNeutral}%</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-orange-400 w-16 uppercase tracking-wider">{t.negative}</span>
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-400 rounded-full" style={{ width: `${sentimentNegative}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-white w-10 text-right">{sentimentNegative}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Items */}
          {actionItems && (
            <>
              <div className="relative py-12">
                <div aria-hidden="true" className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#7c5cff]/20"></div>
                </div>
                <div className="relative flex justify-center">
                  <div className="bg-[#0B0B0F] px-6 flex flex-col items-center gap-1">
                    <h2 className="text-2xl font-black text-white tracking-tight">{t.actionItems}</h2>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">{t.actionItemsSub}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8">
                {actionItems.communication?.length > 0 && (
                  <div className="bg-[#13131A]/80 backdrop-blur-2xl border border-white/5 rounded-2xl p-6 border-t-4 border-[#7c5cff]" style={{ boxShadow: '0 0 30px -10px rgba(124, 92, 255, 0.3)' }}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="size-12 rounded-xl bg-[#7c5cff]/10 flex items-center justify-center text-[#7c5cff]">
                        <span className="material-symbols-outlined text-2xl">chat_bubble</span>
                      </div>
                      <h4 className="font-bold text-white text-lg">{t.communicationFocus}</h4>
                    </div>
                    <ul className="space-y-4">
                      {actionItems.communication.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="mt-1.5 size-1.5 rounded-full bg-[#7c5cff] shrink-0"></div>
                          <p className="text-sm text-slate-300 leading-snug">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {actionItems.business?.length > 0 && (
                  <div className="bg-[#13131A]/80 backdrop-blur-2xl border border-white/5 rounded-2xl p-6 border-t-4 border-[#10b981]" style={{ boxShadow: '0 0 30px -10px rgba(124, 92, 255, 0.3)' }}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="size-12 rounded-xl bg-[#10b981]/10 flex items-center justify-center text-[#10b981]">
                        <span className="material-symbols-outlined text-2xl">show_chart</span>
                      </div>
                      <h4 className="font-bold text-white text-lg">{t.businessFocus}</h4>
                    </div>
                    <ul className="space-y-4">
                      {actionItems.business.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="mt-1.5 size-1.5 rounded-full bg-[#10b981] shrink-0"></div>
                          <p className="text-sm text-slate-300 leading-snug">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {actionItems.audience?.length > 0 && (
                  <div className="bg-[#13131A]/80 backdrop-blur-2xl border border-white/5 rounded-2xl p-6 border-t-4 border-[#a78bfa]" style={{ boxShadow: '0 0 30px -10px rgba(124, 92, 255, 0.3)' }}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="size-12 rounded-xl bg-[#a78bfa]/10 flex items-center justify-center text-[#a78bfa]">
                        <span className="material-symbols-outlined text-2xl">highlight</span>
                      </div>
                      <h4 className="font-bold text-white text-lg">{t.audienceImpact}</h4>
                    </div>
                    <ul className="space-y-4">
                      {actionItems.audience.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="mt-1.5 size-1.5 rounded-full bg-[#a78bfa] shrink-0"></div>
                          <p className="text-sm text-slate-300 leading-snug">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Footer */}
          <div className="flex justify-center pt-8 pb-12">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              {t.aiEngine} • {t.session} ID: {sessionId}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
