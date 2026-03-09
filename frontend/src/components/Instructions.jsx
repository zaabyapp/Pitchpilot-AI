import React from 'react';
import Header from './Header';

const translations = {
  en: {
    breadcrumb: 'Instructions',
    breadcrumbSub: 'Simulation Guide',
    pageTitle: 'Pitch Simulation Instructions',
    pageSubtitle:
      'Follow these steps to run your pitch simulation and receive expert-level AI feedback on your performance and narrative structure.',
    steps: [
      {
        step: 'Step 1',
        title: 'Prepare Your Pitch',
        description:
          'Organize your slides and speaking notes. Ensure your narrative flows logically from the problem statement to your specific technical moat and market opportunity.',
      },
      {
        step: 'Step 2',
        title: 'Set Up Your Environment',
        description:
          'Find a quiet space with good lighting. Grant microphone and camera permissions to PitchPilot AI. We recommend using a headset for the clearest audio capture.',
      },
      {
        step: 'Step 3',
        title: 'Run the Simulation',
        description:
          'Start the recording and deliver your pitch as you would to a real investor. Use our built-in slide controller to sync your transitions with your speech.',
      },
      {
        step: 'Step 4',
        title: 'Receive Your Feedback',
        description:
          "Our AI analyzes your pacing, tone, and content. You'll receive a detailed breakdown of which sections were strongest and where the narrative lost momentum.",
      },
      {
        step: 'Step 5',
        title: 'Practice and Improve',
        description:
          'Review the suggestions, refine your slides or delivery, and run the simulation again. Most founders see significant improvement within 3–5 sessions.',
      },
    ],
    ctaTitle: 'Ready to test your narrative?',
    ctaDescription:
      'Record a practice session and get instant AI feedback on your slide transitions, vocal clarity, and business storytelling.',
    ctaButton: 'Start Practice Session',
    footerGlossary: 'Glossary',
    footerApiDocs: 'API Docs',
    footerPrivacy: 'Privacy',
    footerCopy: '© 2023 PitchPilot AI. Built for founders.',
  },
  es: {
    breadcrumb: 'Instrucciones',
    breadcrumbSub: 'Guía de Simulación',
    pageTitle: 'Instrucciones de Simulación de Pitch',
    pageSubtitle:
      'Sigue estos pasos para ejecutar tu simulación de pitch y recibir retroalimentación experta de IA sobre tu desempeño y estructura narrativa.',
    steps: [
      {
        step: 'Paso 1',
        title: 'Prepara tu Pitch',
        description:
          'Organiza tus diapositivas y notas. Asegúrate de que tu narrativa fluya lógicamente desde el planteamiento del problema hasta tu ventaja técnica y oportunidad de mercado.',
      },
      {
        step: 'Paso 2',
        title: 'Configura tu Entorno',
        description:
          'Encuentra un espacio tranquilo con buena iluminación. Concede permisos de micrófono y cámara a PitchPilot AI. Recomendamos usar audífonos para la captura de audio más clara.',
      },
      {
        step: 'Paso 3',
        title: 'Ejecuta la Simulación',
        description:
          'Inicia la grabación y presenta tu pitch como lo harías ante un inversor real. Usa nuestro controlador de diapositivas integrado para sincronizar tus transiciones con tu discurso.',
      },
      {
        step: 'Paso 4',
        title: 'Recibe tu Retroalimentación',
        description:
          'Nuestra IA analiza tu ritmo, tono y contenido. Recibirás un desglose detallado de qué secciones fueron más fuertes y dónde la narrativa perdió impulso.',
      },
      {
        step: 'Paso 5',
        title: 'Practica y Mejora',
        description:
          'Revisa las sugerencias, refina tus diapositivas o presentación, y vuelve a ejecutar la simulación. La mayoría de los fundadores ven una mejora significativa en 3 a 5 sesiones.',
      },
    ],
    ctaTitle: '¿Listo para probar tu narrativa?',
    ctaDescription:
      'Graba una sesión de práctica y obtén retroalimentación instantánea de IA sobre tus transiciones de diapositivas, claridad vocal y narrativa de negocio.',
    ctaButton: 'Iniciar Sesión de Práctica',
    footerGlossary: 'Glosario',
    footerApiDocs: 'Documentación API',
    footerPrivacy: 'Privacidad',
    footerCopy: '© 2023 PitchPilot AI. Hecho para fundadores.',
  },
};

export default function Instructions({
  language = 'en',
  onStartSession = () => {},
  onNavResources = () => {},
  onNavReporting = () => {},
}) {
  const tx = translations[language] || translations.en;

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0B0F] text-slate-100">
      <Header
        activePage="instructions"
        onNavResources={onNavResources}
        onNavReporting={onNavReporting}
        onStartSession={onStartSession}
        language={language}
      />

      {/* Main */}
      <main className="flex-grow">
        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 pt-16 pb-12">
          <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 uppercase tracking-widest font-semibold">
            <span>{tx.breadcrumb}</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-slate-400">{tx.breadcrumbSub}</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
            {tx.pageTitle}
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">{tx.pageSubtitle}</p>
        </section>

        {/* Steps */}
        <section className="max-w-4xl mx-auto px-6 pb-24">
          <div className="space-y-6">
            {tx.steps.map(({ step, title, description }, idx) => {
              const icons = ['auto_stories', 'videocam', 'play_circle', 'insights', 'history_edu'];
              return (
                <div
                  key={idx}
                  className="group flex flex-col md:flex-row gap-6 p-6 rounded-2xl bg-[#12121A] border border-[#2A2A35] hover:border-[#7C5CFF]/50 transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#7C5CFF]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#7C5CFF]">{icons[idx]}</span>
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
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 mb-24">
          <div className="p-8 md:p-12 rounded-3xl bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 text-center relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#7C5CFF]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[#7C5CFF]/10 rounded-full blur-3xl pointer-events-none" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white relative z-10">{tx.ctaTitle}</h2>
            <p className="text-slate-400 mb-8 max-w-xl mx-auto relative z-10">{tx.ctaDescription}</p>
            <button
              onClick={onStartSession}
              className="bg-[#7C5CFF] hover:bg-[#7C5CFF]/90 text-white px-10 py-4 rounded-xl text-lg font-bold transition-all shadow-xl shadow-[#7C5CFF]/30 relative z-10 hover:scale-[1.02] active:scale-[0.98]"
            >
              {tx.ctaButton}
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
            <button className="hover:text-[#7C5CFF] transition-colors">{tx.footerGlossary}</button>
            <button className="hover:text-[#7C5CFF] transition-colors">{tx.footerApiDocs}</button>
            <button className="hover:text-[#7C5CFF] transition-colors">{tx.footerPrivacy}</button>
          </div>
          <p className="text-xs text-slate-600">{tx.footerCopy}</p>
        </div>
      </footer>
    </div>
  );
}
