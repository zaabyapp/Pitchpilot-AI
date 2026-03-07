import React from 'react';

const steps = [
  {
    icon: 'auto_stories',
    step: 'Step 1',
    title: 'Prepare Your Pitch',
    description:
      'Organize your slides and speaking notes. Ensure your narrative flows logically from the problem statement to your specific technical moat and market opportunity.',
  },
  {
    icon: 'videocam',
    step: 'Step 2',
    title: 'Set Up Your Environment',
    description:
      'Find a quiet space with good lighting. Grant microphone and camera permissions to PitchPilot AI. We recommend using a headset for the clearest audio capture.',
  },
  {
    icon: 'play_circle',
    step: 'Step 3',
    title: 'Run the Simulation',
    description:
      'Start the recording and deliver your pitch as you would to a real investor. Use our built-in slide controller to sync your transitions with your speech.',
  },
  {
    icon: 'insights',
    step: 'Step 4',
    title: 'Receive Your Feedback',
    description:
      `Our AI analyzes your pacing, tone, and content. You'll receive a detailed breakdown of which sections were strongest and where the narrative lost momentum.`,
  },
  {
    icon: 'history_edu',
    step: 'Step 5',
    title: 'Practice and Improve',
    description:
      'Review the suggestions, refine your slides or delivery, and run the simulation again. Most founders see significant improvement within 3–5 sessions.',
  },
];

export default function Instructions({
  onStartSession = () => {},
  onNavResources = () => {},
  onNavReporting = () => {},
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#0B0B0F] text-slate-100">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0B0B0F]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-[#7C5CFF] size-7">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              PitchPilot <span className="text-[#7C5CFF]">AI</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-10">
            <span className="text-sm font-semibold text-[#7C5CFF] relative after:content-[''] after:absolute after:-bottom-[22px] after:left-0 after:right-0 after:h-[2px] after:bg-[#7C5CFF]">
              Instructions
            </span>
            <button
              onClick={onNavResources}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Resources
            </button>
            <button
              onClick={onNavReporting}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Reporting
            </button>
            <button
              onClick={onStartSession}
              className="bg-[#7C5CFF] hover:bg-[#7C5CFF]/90 text-white px-5 py-2 rounded-md text-sm font-semibold transition-all shadow-lg shadow-[#7C5CFF]/20"
            >
              Start Practice
            </button>
          </nav>

          <button className="md:hidden text-slate-400">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-16 pb-12">
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 uppercase tracking-widest font-semibold">
            <span>Instructions</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-slate-400">Simulation Guide</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
            Pitch Simulation Instructions
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            Follow these steps to run your pitch simulation and receive expert-level AI feedback on
            your performance and narrative structure.
          </p>
        </section>

        {/* Steps */}
        <section className="max-w-4xl mx-auto px-6 pb-24">
          <div className="space-y-6">
            {steps.map(({ icon, step, title, description }) => (
              <div
                key={step}
                className="group flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-[#12121A] border border-[#2A2A35] hover:border-[#7C5CFF]/50 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#7C5CFF]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#7C5CFF]">{icon}</span>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-[#7C5CFF] px-2 py-0.5 rounded bg-[#7C5CFF]/10 uppercase tracking-tighter">
                      {step}
                    </span>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                  </div>
                  <p className="text-slate-400 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 mb-24">
          <div className="p-8 md:p-12 rounded-3xl bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 text-center relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#7C5CFF]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[#7C5CFF]/10 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white relative z-10">
              Ready to test your narrative?
            </h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto relative z-10">
              Record a practice session and get instant AI feedback on your slide transitions, vocal
              clarity, and business storytelling.
            </p>
            <button
              onClick={onStartSession}
              className="bg-[#7C5CFF] hover:bg-[#7C5CFF]/90 text-white px-10 py-4 rounded-xl text-lg font-bold transition-all shadow-xl shadow-[#7C5CFF]/30 relative z-10 hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Practice Session
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#0B0B0F]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-40">
            <div className="text-slate-400 size-5">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-400">PitchPilot AI</span>
          </div>
          <div className="flex items-center gap-8 text-sm font-medium text-slate-500">
            <button className="hover:text-[#7C5CFF] transition-colors">Glossary</button>
            <button className="hover:text-[#7C5CFF] transition-colors">API Docs</button>
            <button className="hover:text-[#7C5CFF] transition-colors">Privacy</button>
          </div>
          <p className="text-xs text-slate-600">© 2023 PitchPilot AI. Built for founders.</p>
        </div>
      </footer>
    </div>
  );
}
