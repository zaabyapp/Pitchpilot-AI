import React from 'react';
import Header from './Header';

const translations = {
  en: {
    pageTitle: 'Builder Resources',
    pageSubtitle:
      'A curated collection of educational materials, frameworks, and reference guides designed to help technical founders master the art of the pitch.',
    readMore: 'Read More',
    footerNote: 'New resources added weekly for our premium builder community.',
    footerGlossary: 'Glossary',
    footerApiDocs: 'API Docs',
    footerPrivacy: 'Privacy',
    resources: [
      {
        id: 'pitch-templates',
        icon: 'description',
        category: 'Documentation',
        title: 'Pitch Templates',
        description:
          'Battle-tested slide structures for Seed, Series A, and Demo Day presentations. Includes structural logic for technical deep-dives and market sizing.',
      },
      {
        id: 'ai-best-practices',
        icon: 'psychology',
        category: 'Methodology',
        title: 'AI Best Practices',
        description:
          "Learn how to leverage our AI feedback engine effectively. Understand metrics like 'Sentiment Consistency' and 'Technical Narrative Cohesion'.",
      },
      {
        id: 'investor-questions',
        icon: 'forum',
        category: 'Reference',
        title: 'Investor Question Bank',
        description:
          "An exhaustive list of 100+ questions VCs ask technical teams, categorized by 'GTM Strategy', 'Defensibility', and 'Technical Moat'.",
      },
      {
        id: 'public-speaking',
        icon: 'record_voice_over',
        category: 'Hard Skills',
        title: 'Public Speaking Tips',
        description:
          'Performance techniques for non-performers. Strategies for breath control, pacing technical complexity, and managing stage presence during Q&A.',
      },
    ],
  },
  es: {
    pageTitle: 'Recursos para Builders',
    pageSubtitle:
      'Una colección de materiales educativos, marcos de trabajo y guías de referencia diseñados para ayudar a los fundadores técnicos a dominar el arte del pitch.',
    readMore: 'Leer Más',
    footerNote: 'Nuevos recursos añadidos semanalmente para nuestra comunidad premium.',
    footerGlossary: 'Glosario',
    footerApiDocs: 'Documentación API',
    footerPrivacy: 'Privacidad',
    resources: [
      {
        id: 'pitch-templates',
        icon: 'description',
        category: 'Documentación',
        title: 'Plantillas de Pitch',
        description:
          'Estructuras de diapositivas probadas en batalla para presentaciones de Seed, Series A y Demo Day. Incluye lógica estructural para análisis técnicos profundos y tamaño de mercado.',
      },
      {
        id: 'ai-best-practices',
        icon: 'psychology',
        category: 'Metodología',
        title: 'Buenas Prácticas con IA',
        description:
          "Aprende a aprovechar eficazmente nuestro motor de retroalimentación IA. Entiende métricas como 'Consistencia de Sentimiento' y 'Cohesión Narrativa Técnica'.",
      },
      {
        id: 'investor-questions',
        icon: 'forum',
        category: 'Referencia',
        title: 'Banco de Preguntas de Inversores',
        description:
          "Una lista exhaustiva de más de 100 preguntas que los VCs hacen a equipos técnicos, categorizadas por 'Estrategia GTM', 'Defensibilidad' y 'Ventaja Técnica'.",
      },
      {
        id: 'public-speaking',
        icon: 'record_voice_over',
        category: 'Habilidades Duras',
        title: 'Consejos para Hablar en Público',
        description:
          'Técnicas de actuación para no actores. Estrategias de control de respiración, manejo del ritmo en complejidad técnica y gestión de presencia escénica durante el Q&A.',
      },
    ],
  },
};

export default function BuilderResources({
  language = 'en',
  onBack = () => {},
  onStartSession = () => {},
  onSelectResource = () => {},
  onNavInstructions = () => {},
  onNavReporting = () => {},
}) {
  const tx = translations[language] || translations.en;

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0B0F] text-slate-100">
      <Header
        activePage="resources"
        onNavInstructions={onNavInstructions}
        onNavReporting={onNavReporting}
        onStartSession={onStartSession}
        language={language}
      />

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-8 py-16">
        {/* Back button + Title */}
        <div className="mb-12">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group"
          >
            <span className="material-symbols-outlined text-xl group-hover:-translate-x-0.5 transition-transform">
              arrow_back
            </span>
            <span className="text-sm font-medium">Back</span>
          </button>
          <h2 className="text-4xl font-extrabold text-white mb-4 tracking-tight">{tx.pageTitle}</h2>
          <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">{tx.pageSubtitle}</p>
        </div>

        {/* Resource Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tx.resources.map((resource) => (
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
                onClick={() => onSelectResource({ ...resource, language })}
                className="inline-flex items-center gap-2 text-[#7C5CFF] font-bold text-sm group/link"
              >
                {tx.readMore}
                <span className="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-500 text-sm">{tx.footerNote}</p>
          <div className="flex gap-8">
            <button className="text-slate-500 text-sm hover:text-white transition-colors">{tx.footerGlossary}</button>
            <button className="text-slate-500 text-sm hover:text-white transition-colors">{tx.footerApiDocs}</button>
            <button className="text-slate-500 text-sm hover:text-white transition-colors">{tx.footerPrivacy}</button>
          </div>
        </div>
      </main>
    </div>
  );
}
