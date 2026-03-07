import React from 'react';

export default function FeedbackReport({
  sessionId = '#------',
  language = 'en',
  feedbackData = null,
  sessionData = null,
  onViewTranscript = () => {},
  onNewSession = () => {},
  onNavInstructions = () => {},
  onNavResources = () => {},
}) {
  // Loading state — report not yet available
  if (!feedbackData) {
    return (
      <div className="relative flex flex-col min-h-screen overflow-hidden bg-[#0B0B0F] text-slate-200 antialiased">
        <header className="flex items-center justify-between border-b border-white/5 px-8 py-3 bg-[#0B0B0F]/80 backdrop-blur-md z-30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-[#7c5cff] size-8">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor" />
              </svg>
            </div>
            <h2 className="text-white text-lg font-bold tracking-tight">PitchPilot <span className="text-[#7c5cff]">AI</span></h2>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-8">
          <div className="size-16 rounded-full bg-[#7c5cff]/10 border border-[#7c5cff]/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#7c5cff] text-2xl">analytics</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Report not available</h2>
            <p className="text-slate-400 text-sm max-w-sm">Complete a pitch simulation to generate your personalized feedback report.</p>
          </div>
          <button onClick={onNewSession} className="bg-[#7C5CFF] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#7C5CFF]/90 transition-all">
            Start a Session
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
    businessRecommendations,
    confusingMoments,
    topImprovements,
    deliveryMetrics,
    videoPresence,
    voiceAnalysis,
    practicePrompts,
    actionItems,
  } = feedbackData;

  const circumference = 2 * Math.PI * 58;
  const strokeDashoffset = circumference - ((score ?? 0) / 100) * circumference;

  const colorMap = {
    orange: { border: 'border-l-orange-400', bg: 'bg-orange-400/10', text: 'text-orange-400' },
    primary: { border: 'border-l-[#7c5cff]', bg: 'bg-[#7c5cff]/10', text: 'text-[#7c5cff]' },
    purple: { border: 'border-l-[#a78bfa]', bg: 'bg-[#a78bfa]/10', text: 'text-[#a78bfa]' },
  };

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden bg-[#0B0B0F] text-slate-200 antialiased">
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
        <nav className="hidden md:flex items-center gap-8">
          <button onClick={onNavInstructions} className="text-slate-400 text-sm font-medium hover:text-white transition-colors">Instructions</button>
          <button onClick={onNavResources} className="text-slate-400 text-sm font-medium hover:text-white transition-colors">Resources</button>
          <span className="text-white text-sm font-semibold border-b-2 border-[#7c5cff] py-4 -mb-4">Reporting</span>
          <button onClick={onNewSession} className="bg-[#7C5CFF] text-white text-sm font-bold px-5 py-2.5 rounded-md hover:bg-[#7C5CFF]/90 transition-all">New Session</button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
          {/* Title Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/5">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight mb-1">Pitch Performance Report</h1>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-[#7c5cff] animate-pulse"></span>
                <p className="text-slate-400 font-medium">AI-generated analysis of your session</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Session: {sessionId}</span>
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
                <span className="text-xs font-bold uppercase tracking-wider">Level: {level}</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Your pitch analysis is ready</h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">{summary}</p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-2 h-11 px-6 bg-[#7c5cff] text-white text-sm font-bold rounded-xl hover:bg-[#7c5cff]/90 transition-all shadow-lg shadow-[#7c5cff]/20"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                Export Report
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: 'PitchPilot AI Report', text: `Session ${sessionId} — Score: ${score}/100`, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href).catch(() => {});
                  }
                }}
                className="flex items-center justify-center gap-2 h-11 px-6 bg-white/5 text-white text-sm font-bold rounded-xl hover:bg-white/10 transition-all border border-white/5"
              >
                <span className="material-symbols-outlined text-sm">share</span>
                Share Report
              </button>
              {sessionData?.questionsAnswered != null && (
                <div className="flex items-center justify-center gap-2 h-11 px-6 bg-white/5 border border-white/5 rounded-xl">
                  <span className="material-symbols-outlined text-sm text-[#7c5cff]">quiz</span>
                  <span className="text-xs text-slate-400">
                    {sessionData.questionsAnswered} question{sessionData.questionsAnswered !== 1 ? 's' : ''} answered
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-8 space-y-8">

              {/* What You Did Well */}
              {whatWentWell?.length > 0 && (
                <div className="bg-[#13131A]/60 backdrop-blur-2xl border border-white/5 rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-white">What You Did Well</h3>
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

              {/* Business Recommendations */}
              {businessRecommendations?.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/5"></div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Strategic Advisor: Business Recommendations</h3>
                    <div className="h-px flex-1 bg-white/5"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {businessRecommendations.map((rec, idx) => (
                      <div key={idx} className="bg-[#13131A]/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-6 border-t-2 border-t-[#7c5cff]/40">
                        <div className="flex items-start gap-4">
                          <div className="size-10 rounded-xl bg-[#7c5cff]/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[#7c5cff] text-xl">lightbulb</span>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-bold text-white">{rec.title}</h4>
                            <p className="text-sm text-slate-400 leading-relaxed">{rec.description}</p>
                            <div className="pt-2">
                              <span className="text-[10px] font-bold text-[#7c5cff] uppercase tracking-wider block mb-1">Actionable Suggestion</span>
                              <p className="text-xs text-slate-300 bg-white/5 rounded-lg p-3">{rec.suggestion}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Confusing Moments */}
              {confusingMoments?.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/5"></div>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Strategic Advisor: What Was Confusing</h3>
                    <div className="h-px flex-1 bg-white/5"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {confusingMoments.map((moment, idx) => (
                      <div key={idx} className="bg-[#13131A]/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-orange-500/20 text-orange-400 text-[10px] font-black px-2 py-1 rounded">{moment.timestamp}</div>
                          <span className="material-symbols-outlined text-orange-400 text-xl">help</span>
                        </div>
                        <h4 className="font-bold text-slate-200 mb-2">{moment.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">{moment.description}</p>
                        <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Simplification</span>
                          <p className="text-[11px] text-slate-300">{moment.simplification}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="lg:col-span-4 space-y-6">

              {/* Top Improvements */}
              {topImprovements?.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-2">Top Improvements</h3>
                  {topImprovements.map((imp, idx) => {
                    const colors = colorMap[imp.color] || colorMap.primary;
                    return (
                      <div key={idx} className={`bg-[#13131A]/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-5 border-l-4 ${colors.border}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`size-8 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text}`}>
                            <span className="material-symbols-outlined text-lg">trending_up</span>
                          </div>
                          <h4 className="font-bold text-white">{imp.title}</h4>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-3">{imp.description}</p>
                        <div className={`text-[10px] font-bold ${colors.text} uppercase tracking-wider`}>Actionable: {imp.actionable}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Delivery Metrics */}
              {deliveryMetrics && (
                <div className="bg-[#13131A]/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-6">
                  <h3 className="font-bold text-sm mb-6 flex items-center gap-2 text-white">
                    <span className="material-symbols-outlined text-[#7c5cff] text-lg">mic_external_on</span>
                    Delivery Metrics
                  </h3>
                  <div className="space-y-5">
                    {Object.entries(deliveryMetrics).map(([key, value]) => (
                      <div key={key} className="space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-slate-400 capitalize">{key}</span>
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

              {/* Video Presence */}
              {videoPresence && (
                <div className="bg-[#13131A]/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-6">
                  <h3 className="font-bold text-sm mb-4 flex items-center gap-2 text-white">
                    <span className="material-symbols-outlined text-[#7c5cff] text-lg">videocam</span>
                    Video Presence
                  </h3>
                  <div className="flex justify-between gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="size-14 rounded-full border-2 border-[#7c5cff] border-t-white/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{videoPresence.eyeContact}%</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Eye Contact</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="size-14 rounded-full border-2 border-[#a78bfa] border-t-white/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{videoPresence.posture}%</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Posture</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-slate-400 italic leading-tight">{videoPresence.quote}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Voice Analysis */}
          {voiceAnalysis && (
            <div className="bg-[#13131A]/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-8">
              <h3 className="font-bold text-lg mb-8 flex items-center gap-2 text-white">
                <span className="material-symbols-outlined text-[#7c5cff]">analytics</span>
                Voice Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Average Pitch</span>
                  <div className="text-xl font-bold text-white">{voiceAnalysis.avgPitch}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Words Per Minute</span>
                  <div className="text-xl font-bold text-white">{voiceAnalysis.wpm}</div>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Sentiment Balance</span>
                  <div className="text-xl font-bold text-white">{voiceAnalysis.sentiment}</div>
                </div>
              </div>
            </div>
          )}

          {/* Practice Prompts */}
          {practicePrompts?.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#7c5cff] text-lg">psychology</span>
                Recommended Practice Prompts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {practicePrompts.map((prompt, idx) => (
                  <div key={idx} className="bg-[#13131A]/60 backdrop-blur-2xl border border-white/5 rounded-2xl p-6 hover:border-[#7c5cff]/30 transition-all cursor-pointer group">
                    <div className="size-10 rounded-xl bg-[#7c5cff]/10 flex items-center justify-center mb-4 text-[#7c5cff]">
                      <span className="material-symbols-outlined">exercise</span>
                    </div>
                    <h4 className="font-bold text-white mb-2">{prompt.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{prompt.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Items */}
          {actionItems && (
            <>
              <div className="relative py-12">
                <div aria-hidden="true" className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#7c5cff]/20"></div>
                </div>
                <div className="relative flex justify-center">
                  <div className="bg-[#0B0B0F] px-6 flex flex-col items-center gap-1">
                    <h2 className="text-2xl font-black text-white tracking-tight">Action Items</h2>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Your next steps to improve this pitch</p>
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
                      <h4 className="font-bold text-white text-lg">Communication Focus</h4>
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
                      <h4 className="font-bold text-white text-lg">Business Focus</h4>
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
                      <h4 className="font-bold text-white text-lg">Audience Impact</h4>
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

          {/* View Transcript */}
          <div className="pt-4">
            <button onClick={onViewTranscript} className="block w-full bg-[#13131A]/60 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 hover:bg-white/5 transition-all group text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined">subject</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-lg">View Session Transcript</h4>
                    <p className="text-xs text-slate-500">Open full transcript and detailed analysis</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-500 group-hover:text-[#7c5cff] group-hover:translate-x-1 transition-all">chevron_right</span>
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="flex justify-center pt-8 pb-12">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              AI Analysis Engine • Session ID: {sessionId}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
