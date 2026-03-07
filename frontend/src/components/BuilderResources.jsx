import React from 'react';

const resources = [
  {
    id: 'pitch-templates',
    icon: 'description',
    category: 'Documentation',
    title: 'Pitch Templates',
    description: 'Battle-tested slide structures for Seed, Series A, and Demo Day presentations. Includes structural logic for technical deep-dives and market sizing.',
  },
  {
    id: 'ai-best-practices',
    icon: 'psychology',
    category: 'Methodology',
    title: 'AI Best Practices',
    description: "Learn how to leverage our AI feedback engine effectively. Understand metrics like 'Sentiment Consistency' and 'Technical Narrative Cohesion'.",
  },
  {
    id: 'investor-questions',
    icon: 'forum',
    category: 'Reference',
    title: 'Investor Question Bank',
    description: "An exhaustive list of 100+ questions VCs ask technical teams, categorized by 'GTM Strategy', 'Defensibility', and 'Technical Moat'.",
  },
  {
    id: 'public-speaking',
    icon: 'record_voice_over',
    category: 'Hard Skills',
    title: 'Public Speaking Tips',
    description: 'Performance techniques for non-performers. Strategies for breath control, pacing technical complexity, and managing stage presence during Q&A.',
  },
];

export default function BuilderResources({
  onStartSession = () => {},
  onSelectResource = () => {},
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
        <div className="flex items-center gap-10">
          <nav className="hidden md:flex items-center gap-10">
            <button onClick={onNavInstructions} className="text-slate-400 text-sm font-medium hover:text-white transition-colors">Instructions</button>
            <span className="text-[#7C5CFF] text-sm font-semibold underline underline-offset-8">Resources</span>
            <button onClick={onNavReporting} className="text-slate-400 text-sm font-medium hover:text-white transition-colors">Reporting</button>
          </nav>
          <div className="flex items-center">
            <button
              onClick={onStartSession}
              className="bg-[#7C5CFF] text-white text-sm font-bold px-5 py-2.5 rounded-md hover:bg-[#7C5CFF]/90 transition-all"
            >
              Start Practice
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-16">
        {/* Title */}
        <div className="mb-12">
          <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Builder Resources</h2>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
            A curated collection of educational materials, frameworks, and reference guides designed to help technical founders master the art of the pitch.
          </p>
        </div>

        {/* Resource Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="bg-[#12121A] border border-[#2A2A35] hover:border-[#7C5CFF] transition-colors p-8 rounded-lg flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-[#7C5CFF]">{resource.icon}</span>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{resource.category}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-[#7C5CFF] transition-colors">
                  {resource.title}
                </h3>
                <p className="text-slate-400 leading-relaxed mb-8">{resource.description}</p>
              </div>
              <button
                onClick={() => onSelectResource(resource)}
                className="inline-flex items-center gap-2 text-[#7C5CFF] font-bold text-sm group/link"
              >
                Read More
                <span className="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">arrow_forward</span>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-sm">
            New resources added weekly for our premium builder community.
          </p>
          <div className="flex gap-8">
            <button className="text-slate-500 text-sm hover:text-white transition-colors">Glossary</button>
            <button className="text-slate-500 text-sm hover:text-white transition-colors">API Docs</button>
            <button className="text-slate-500 text-sm hover:text-white transition-colors">Privacy</button>
          </div>
        </div>
      </main>
    </div>
  );
}
