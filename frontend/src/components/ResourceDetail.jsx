import React from 'react';

const defaultResource = {
  title: 'Pitch Templates for Technical Founders',
  category: 'Documentation',
  readTime: '5 min read',
  lastUpdated: 'Oct 2023',
  author: 'PitchPilot Editorial',
};

export default function ResourceDetail({
  resource = defaultResource,
  onBack = () => {},
  onStartSession = () => {},
  onNavInstructions = () => {},
  onNavReporting = () => {},
}) {
  return (
    <div className="flex flex-col min-h-screen bg-[#0B0B0F] text-slate-100">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/5 px-8 py-4 bg-[#0B0B0F]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="text-[#7C5CFF] size-7">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor" />
            </svg>
          </div>
          <h1 className="text-white text-xl font-bold tracking-tight">PitchPilot <span className="text-[#7C5CFF]">AI</span></h1>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <button onClick={onNavInstructions} className="text-slate-400 text-sm font-medium hover:text-white transition-colors">Instructions</button>
          <span className="text-[#7C5CFF] text-sm font-semibold relative after:content-[''] after:absolute after:-bottom-[21px] after:left-0 after:right-0 after:h-[2px] after:bg-[#7C5CFF]">Resources</span>
          <button onClick={onNavReporting} className="text-slate-400 text-sm font-medium hover:text-white transition-colors">Reporting</button>
        </nav>
        <div className="flex items-center gap-4">
          <button
            onClick={onStartSession}
            className="bg-[#7C5CFF] text-white text-sm font-bold px-5 py-2.5 rounded-md hover:bg-[#7C5CFF]/90 transition-all"
          >
            Start Practice
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full">
        {/* Title Section */}
        <div className="max-w-3xl mx-auto px-8 pt-16 pb-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-slate-500 text-sm mb-8">
            <button onClick={onBack} className="hover:text-[#7C5CFF] transition-colors">Resources</button>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-slate-300">{resource.title}</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            {resource.title}
          </h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-6 text-slate-500 text-sm border-b border-white/5 pb-10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">schedule</span>
              <span>{resource.readTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">calendar_today</span>
              <span>Last updated: {resource.lastUpdated}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base">person</span>
              <span>By {resource.author}</span>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <article className="max-w-3xl mx-auto px-8 pb-20">
          <p className="text-slate-400 leading-relaxed mb-6 text-lg">
            For technical founders, the challenge isn't the depth of the product—it's the clarity of the narrative. A great pitch deck translates complex technical achievement into clear business value. This guide provides battle-tested structures for various stages of your startup's journey.
          </p>

          <h2 className="text-2xl font-bold text-white mt-12 mb-6 tracking-tight">Phase 1: Seed Stage Structure</h2>
          <p className="text-slate-400 leading-relaxed mb-6 text-lg">
            At the Seed stage, you are selling the vision and the team's ability to build. Your deck should focus on the technical moat and the early signals of product-market fit.
          </p>

          <ul className="mb-8 space-y-3">
            <li className="text-slate-400 flex items-start gap-3 text-lg">
              <span className="text-[#7C5CFF] font-bold">•</span>
              <span><strong className="text-white">The Problem:</strong> Define the technical bottleneck or efficiency gap in the current market.</span>
            </li>
            <li className="text-slate-400 flex items-start gap-3 text-lg">
              <span className="text-[#7C5CFF] font-bold">•</span>
              <span><strong className="text-white">The Solution:</strong> Your unique approach (the "Secret Sauce").</span>
            </li>
            <li className="text-slate-400 flex items-start gap-3 text-lg">
              <span className="text-[#7C5CFF] font-bold">•</span>
              <span><strong className="text-white">Technical Insight:</strong> Why is this possible now? (Moore's Law, new LLM capabilities, etc.)</span>
            </li>
            <li className="text-slate-400 flex items-start gap-3 text-lg">
              <span className="text-[#7C5CFF] font-bold">•</span>
              <span><strong className="text-white">The Team:</strong> Focus on engineering pedigree and domain expertise.</span>
            </li>
          </ul>

          {/* Pro Tip */}
          <div className="bg-[#12121A] border-l-4 border-[#7C5CFF] p-6 my-10 rounded-r-lg">
            <div className="flex items-center gap-2 mb-2 text-[#7C5CFF]">
              <span className="material-symbols-outlined">lightbulb</span>
              <span className="font-bold uppercase tracking-wider text-xs">Pro Tip</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              Don't hide the complexity, but don't lead with it. Use an "Appendix" for deep-dive architectural diagrams so you can pull them up during Q&A without cluttering the main narrative flow.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-white mt-12 mb-6 tracking-tight">Phase 2: Series A Structure</h2>
          <p className="text-slate-400 leading-relaxed mb-6 text-lg">
            By Series A, investors want to see the machine. You've proven it works; now show how it scales. The narrative shifts from "can we build it?" to "can we grow it?".
          </p>

          <ul className="mb-8 space-y-3">
            <li className="text-slate-400 flex items-start gap-3 text-lg">
              <span className="text-[#7C5CFF] font-bold">•</span>
              <span><strong className="text-white">Momentum:</strong> Growth charts that align with technical milestones.</span>
            </li>
            <li className="text-slate-400 flex items-start gap-3 text-lg">
              <span className="text-[#7C5CFF] font-bold">•</span>
              <span><strong className="text-white">Defensibility:</strong> Discussion of IP, data flywheels, or network effects.</span>
            </li>
            <li className="text-slate-400 flex items-start gap-3 text-lg">
              <span className="text-[#7C5CFF] font-bold">•</span>
              <span><strong className="text-white">Go-To-Market:</strong> How your technical superiority leads to lower CAC or higher ACV.</span>
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-white mt-12 mb-6 tracking-tight">Phase 3: Demo Day Pitch</h2>
          <p className="text-slate-400 leading-relaxed mb-6 text-lg">
            Demo Day is about impact and memorability. You usually have less than 3 minutes to make a lasting impression.
          </p>

          <ul className="mb-8 space-y-3">
            <li className="text-slate-400 flex items-start gap-3 text-lg">
              <span className="text-[#7C5CFF] font-bold">•</span>
              <span><strong className="text-white">The One-Liner:</strong> High-concept pitch (e.g., "Postman for AI agents").</span>
            </li>
            <li className="text-slate-400 flex items-start gap-3 text-lg">
              <span className="text-[#7C5CFF] font-bold">•</span>
              <span><strong className="text-white">The Live Demo (or Video):</strong> Show, don't just tell. Show the product solving a hard problem in real-time.</span>
            </li>
            <li className="text-slate-400 flex items-start gap-3 text-lg">
              <span className="text-[#7C5CFF] font-bold">•</span>
              <span><strong className="text-white">The Ask:</strong> Be specific about what you're raising and what technical milestones it unlocks.</span>
            </li>
          </ul>

          {/* CTA Section */}
          <div className="mt-16 pt-10 border-t border-white/5">
            <div className="bg-[#7C5CFF]/5 border border-[#7C5CFF]/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-white mt-0 mb-2">Ready to test your narrative?</h3>
                <p className="text-slate-400 text-sm mb-0">Record a practice session and get instant AI feedback on your slide transitions.</p>
              </div>
              <button
                onClick={onStartSession}
                className="whitespace-nowrap bg-[#7C5CFF] text-white font-bold px-8 py-3 rounded-lg hover:shadow-[0_0_20px_rgba(124,92,255,0.3)] transition-all"
              >
                Start Practice Session
              </button>
            </div>
          </div>
        </article>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto w-full px-8 py-12 border-t border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3 opacity-50">
              <div className="text-white size-5">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 42.4379C4 42.4379 14.0962 36.0744 24 41.1692C35.0664 46.8624 44 42.2078 44 42.2078L44 7.01134C44 7.01134 35.068 11.6577 24.0031 5.96913C14.0971 0.876274 4 7.27094 4 7.27094L4 42.4379Z" fill="currentColor" />
                </svg>
              </div>
              <span className="text-white text-sm font-bold tracking-tight">PitchPilot AI</span>
            </div>
            <div className="flex gap-8">
              <button className="text-slate-500 text-sm hover:text-white transition-colors">Glossary</button>
              <button className="text-slate-500 text-sm hover:text-white transition-colors">API Docs</button>
              <button className="text-slate-500 text-sm hover:text-white transition-colors">Privacy</button>
            </div>
            <p className="text-slate-500 text-sm">
              © 2023 PitchPilot AI. Built for founders.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
