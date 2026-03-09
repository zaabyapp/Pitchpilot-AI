import React from 'react';
import Header from './Header';

// ---------------------------------------------------------------------------
// UI strings (breadcrumb, metadata labels, CTA, footer)
// ---------------------------------------------------------------------------
const UI = {
  en: {
    breadcrumbResources: 'Resources',
    lastUpdated: 'Last updated',
    by: 'By',
    back: 'Back',
    ctaTitle: 'Ready to test your narrative?',
    ctaDescription: 'Record a practice session and get instant AI feedback on your slide transitions.',
    ctaButton: 'Start Practice Session',
    glossary: 'Glossary',
    apiDocs: 'API Docs',
    privacy: 'Privacy',
    footerCopy: '© 2023 PitchPilot AI. Built for founders.',
    proTipLabel: 'Pro Tip',
  },
  es: {
    breadcrumbResources: 'Recursos',
    lastUpdated: 'Última actualización',
    by: 'Por',
    back: 'Volver',
    ctaTitle: '¿Listo para probar tu narrativa?',
    ctaDescription: 'Graba una sesión de práctica y obtén retroalimentación instantánea de IA sobre tus transiciones.',
    ctaButton: 'Iniciar Sesión de Práctica',
    glossary: 'Glosario',
    apiDocs: 'Documentación API',
    privacy: 'Privacidad',
    footerCopy: '© 2023 PitchPilot AI. Hecho para fundadores.',
    proTipLabel: 'Consejo Pro',
  },
};

// ---------------------------------------------------------------------------
// Article content per resource ID, per language.
// Each section: { heading, para, bullets: [{label, text}], proTip: {text} }
// ---------------------------------------------------------------------------
const ARTICLES = {
  en: {
    'pitch-templates': {
      intro:
        "For technical founders, the challenge isn't the depth of the product—it's the clarity of the narrative. A great pitch deck translates complex technical achievement into clear business value. This guide provides battle-tested structures for various stages of your startup's journey.",
      sections: [
        {
          heading: 'Phase 1: Seed Stage Structure',
          para: "At the Seed stage, you are selling the vision and the team's ability to build. Your deck should focus on the technical moat and the early signals of product-market fit.",
          bullets: [
            { label: 'The Problem', text: 'Define the technical bottleneck or efficiency gap in the current market.' },
            { label: 'The Solution', text: 'Your unique approach (the "Secret Sauce").' },
            { label: 'Technical Insight', text: 'Why is this possible now? (Moore\'s Law, new LLM capabilities, etc.)' },
            { label: 'The Team', text: 'Focus on engineering pedigree and domain expertise.' },
          ],
          proTip:
            'Don\'t hide the complexity, but don\'t lead with it. Use an "Appendix" for deep-dive architectural diagrams so you can pull them up during Q&A without cluttering the main narrative flow.',
        },
        {
          heading: 'Phase 2: Series A Structure',
          para: 'By Series A, investors want to see the machine. You\'ve proven it works; now show how it scales. The narrative shifts from "can we build it?" to "can we grow it?".',
          bullets: [
            { label: 'Momentum', text: 'Growth charts that align with technical milestones.' },
            { label: 'Defensibility', text: 'Discussion of IP, data flywheels, or network effects.' },
            { label: 'Go-To-Market', text: 'How your technical superiority leads to lower CAC or higher ACV.' },
          ],
        },
        {
          heading: 'Phase 3: Demo Day Pitch',
          para: 'Demo Day is about impact and memorability. You usually have less than 3 minutes to make a lasting impression.',
          bullets: [
            { label: 'The One-Liner', text: 'High-concept pitch (e.g., "Postman for AI agents").' },
            { label: 'The Live Demo (or Video)', text: "Show, don't just tell. Show the product solving a hard problem in real-time." },
            { label: 'The Ask', text: "Be specific about what you're raising and what technical milestones it unlocks." },
          ],
        },
      ],
    },

    'ai-best-practices': {
      intro:
        'The AI feedback engine measures more than just what you say — it analyzes how you say it. Understanding these metrics helps you interpret your report and focus your practice on what matters most.',
      sections: [
        {
          heading: 'Understanding Your Core Metrics',
          para: 'Every session produces scores across four dimensions. Knowing what each one measures lets you target your next practice session.',
          bullets: [
            { label: 'Sentiment Consistency', text: 'Measures whether your emotional tone stays aligned with your message. Describing a serious problem with an upbeat tone registers as a mismatch.' },
            { label: 'Technical Narrative Cohesion', text: 'Scores how well your technical explanations connect to business outcomes. A high score means every technical point lands as a business benefit.' },
            { label: 'Pacing Score', text: 'Tracks whether you rush through complex sections or dwell too long on obvious points.' },
            { label: 'Energy Curve', text: 'Maps your vocal energy over time. The ideal arc starts high, dips during the problem setup, and peaks at your solution reveal.' },
          ],
          proTip:
            "The AI can detect when you're reading from notes versus speaking naturally. Sessions where you speak freely — even imperfectly — produce more accurate and actionable feedback.",
        },
        {
          heading: 'Getting the Most from Your Sessions',
          para: 'The feedback engine is most valuable when you treat each session as a controlled experiment.',
          bullets: [
            { label: 'Review, don\'t react', text: 'Read the full report before making changes. Patterns across multiple sessions reveal real weaknesses, not session noise.' },
            { label: 'Focus on one metric per session', text: 'Trying to fix everything at once rarely works. Pick the lowest-scoring dimension and build a session around improving it.' },
            { label: 'Use the transcript', text: 'The highlighted sections in the transcript correspond directly to the moments that drove your scores — both positive and negative.' },
            { label: 'Track the trend, not the score', text: 'A single score is a data point. Three consecutive sessions show a pattern. Run at least three sessions before drawing conclusions.' },
          ],
        },
      ],
    },

    'investor-questions': {
      intro:
        "Venture capitalists have a playbook. The questions they ask aren't random — they're designed to stress-test your assumptions and reveal how deeply you understand your business. This bank covers the questions VCs ask most frequently, organized by category.",
      sections: [
        {
          heading: 'GTM Strategy',
          para: 'These questions probe whether you have a clear, repeatable path to acquiring and retaining customers.',
          bullets: [
            { label: 'ICP Definition', text: 'Who is your ideal customer — not just demographic, but psychographic? What specific pain makes them buy today rather than next quarter?' },
            { label: 'First 10 Customers', text: 'How did you get them, and what does the acquisition method tell you about repeatability at scale?' },
            { label: 'CAC and Payback', text: "What's your customer acquisition cost and payback period? How does it change as you move from founder-led sales to a scaled distribution channel?" },
            { label: 'Beating Inaction', text: 'How do you win against the default option — doing nothing? What triggers the decision to buy now?' },
          ],
          proTip:
            "Don't just memorize answers. The best founders can answer follow-up questions that aren't in any list. Practice the underlying reasoning, not the surface answer.",
        },
        {
          heading: 'Defensibility',
          para: 'Investors want to know that the business they fund today will be hard to copy in three years.',
          bullets: [
            { label: 'Moat in 3 Years', text: 'Is your advantage data accumulation, switching costs, network effects, or brand? Which of these compounds fastest in your market?' },
            { label: 'Well-Funded Competitor', text: 'What happens if a competitor with $50M copies your product exactly tomorrow? What would they still be missing?' },
            { label: 'Proprietary Assets', text: 'Do you have IP, exclusive datasets, or partnerships that competitors cannot easily replicate?' },
            { label: 'Compounding Defensibility', text: 'Does your advantage grow stronger as you get more customers? If not, what is the plan to build that dynamic?' },
          ],
        },
        {
          heading: 'Technical Moat',
          para: 'For technical founders, this is the area where you have the most credibility — and the most risk of going too deep.',
          bullets: [
            { label: '10x Differentiation', text: 'What makes your technical approach 10x better — not just different? "Better" must translate to a measurable business outcome.' },
            { label: 'Open Source Test', text: "If you open-sourced your core algorithm tomorrow, how long until a well-funded competitor caught up? What would they still lack?" },
            { label: 'Proprietary Data', text: "What data do you have access to that others don't? How does it improve your product over time in a way competitors can't replicate?" },
            { label: 'Hardest Problem', text: "What's the most technically difficult problem you've solved, and why does solving it matter to the business and to the customer?" },
          ],
        },
      ],
    },

    'public-speaking': {
      intro:
        "Most technical founders don't have a content problem — they have a delivery problem. The ideas are there, but the way they're communicated creates friction. These techniques are designed for people who are great at building but less comfortable performing.",
      sections: [
        {
          heading: 'Breath Control',
          para: 'Your voice is a physical instrument. Controlling your breath controls your pace, tone, and perceived confidence.',
          bullets: [
            { label: 'The 4-7-8 Technique', text: 'Before you begin, inhale for 4 counts, hold for 7, exhale for 8. This activates your parasympathetic nervous system and reduces the adrenaline spike that causes a shaky voice.' },
            { label: 'Pause Intentionally', text: 'Most speakers rush because silence feels like failure. A deliberate 2-second pause after a key point reads as confidence, not hesitation.' },
            { label: 'Breathe at Punctuation', text: 'Train yourself to inhale at commas and exhale at periods. This naturally controls your pacing and prevents running sentences together.' },
          ],
          proTip:
            'Record yourself with your phone during practice, then watch it on mute. You\'ll spot body language issues — crossed arms, averted eyes, nervous movements — that you cannot feel when you\'re in the moment.',
        },
        {
          heading: 'Pacing for Technical Complexity',
          para: "Speed is the most common delivery mistake. Founders rush through technical content because they've heard it a hundred times — but the audience is encountering it for the first time.",
          bullets: [
            { label: 'Slow Down for Difficult Parts', text: 'Counter-intuitively, slowing down on your most technical explanations signals confidence. Rushing signals anxiety.' },
            { label: 'Analogies as Anchors', text: 'When you deploy a complex concept, immediately follow with "Think of it like...". This gives the audience a mental foothold before you continue.' },
            { label: 'Chunk Your Information', text: 'Never deliver more than three related points without a pause or brief summary. Group, pause, continue.' },
          ],
        },
        {
          heading: 'Stage Presence During Q&A',
          para: "Q&A is where pitches are won and lost. Preparation and structure matter more than spontaneity.",
          bullets: [
            { label: 'The PREP Framework', text: 'For every investor question: state your Point, explain the Reason, give an Example, then restate the Point. This structure prevents rambling and signals clarity of thought.' },
            { label: 'Handle the Hostile Question', text: 'When a question feels adversarial, don\'t defend — reframe. "That\'s an important concern. Here\'s how we\'ve thought about it." Then answer directly.' },
            { label: 'Your Three Non-Negotiables', text: "There are always 3 points you can't afford to leave the room without making. If Q&A goes long, find a natural opening to weave them in." },
          ],
        },
      ],
    },
  },

  es: {
    'pitch-templates': {
      intro:
        'Para los fundadores técnicos, el desafío no es la profundidad del producto — es la claridad de la narrativa. Un buen pitch deck traduce logros técnicos complejos en valor de negocio claro. Esta guía proporciona estructuras probadas en batalla para diversas etapas del camino de tu startup.',
      sections: [
        {
          heading: 'Fase 1: Estructura para Seed',
          para: 'En la etapa Seed, estás vendiendo la visión y la capacidad del equipo para construir. Tu deck debe enfocarse en la ventaja técnica y las primeras señales de product-market fit.',
          bullets: [
            { label: 'El Problema', text: 'Define el cuello de botella técnico o la brecha de eficiencia en el mercado actual.' },
            { label: 'La Solución', text: 'Tu enfoque único (la "salsa secreta").' },
            { label: 'Insight Técnico', text: '¿Por qué es esto posible ahora? (Ley de Moore, nuevas capacidades de LLM, etc.)' },
            { label: 'El Equipo', text: 'Enfócate en el pedigrí de ingeniería y la experiencia en el dominio.' },
          ],
          proTip:
            'No ocultes la complejidad, pero tampoco la pongas al frente. Usa un "Apéndice" para diagramas arquitectónicos profundos, para que puedas mostrarlos durante el Q&A sin saturar el flujo narrativo principal.',
        },
        {
          heading: 'Fase 2: Estructura para Serie A',
          para: 'En la Serie A, los inversores quieren ver la máquina. Ya demostraste que funciona; ahora muestra cómo escala. La narrativa pasa de "¿podemos construirlo?" a "¿podemos hacerlo crecer?".',
          bullets: [
            { label: 'Impulso', text: 'Gráficos de crecimiento alineados con hitos técnicos.' },
            { label: 'Defensibilidad', text: 'Discusión de IP, volantes de datos o efectos de red.' },
            { label: 'Go-To-Market', text: 'Cómo tu superioridad técnica lleva a un CAC más bajo o un ACV más alto.' },
          ],
        },
        {
          heading: 'Fase 3: Pitch para Demo Day',
          para: 'El Demo Day es sobre impacto y memorabilidad. Generalmente tienes menos de 3 minutos para causar una impresión duradera.',
          bullets: [
            { label: 'El One-Liner', text: 'Pitch de alto concepto (p. ej., "Postman para agentes de IA").' },
            { label: 'La Demo en Vivo (o Video)', text: 'Muestra, no solo cuentes. Muestra el producto resolviendo un problema difícil en tiempo real.' },
            { label: 'El Pedido', text: 'Sé específico sobre lo que estás levantando y qué hitos técnicos desbloquea.' },
          ],
        },
      ],
    },

    'ai-best-practices': {
      intro:
        'El motor de retroalimentación IA mide más que solo lo que dices — analiza cómo lo dices. Entender estas métricas te ayuda a interpretar tu informe y enfocar tu práctica en lo que más importa.',
      sections: [
        {
          heading: 'Entendiendo tus Métricas Principales',
          para: 'Cada sesión produce puntajes en cuatro dimensiones. Saber qué mide cada una te permite orientar tu próxima sesión de práctica.',
          bullets: [
            { label: 'Consistencia de Sentimiento', text: 'Mide si tu tono emocional se mantiene alineado con tu mensaje. Describir un problema serio con un tono alegre se registra como una incongruencia.' },
            { label: 'Cohesión Narrativa Técnica', text: 'Evalúa qué tan bien tus explicaciones técnicas se conectan con los resultados de negocio. Un puntaje alto significa que cada punto técnico aterriza como un beneficio empresarial.' },
            { label: 'Puntaje de Ritmo', text: 'Rastrea si avanzas demasiado rápido en secciones complejas o te detienes demasiado en puntos obvios.' },
            { label: 'Curva de Energía', text: 'Mapea tu energía vocal a lo largo del tiempo. El arco ideal comienza alto, baja durante el planteamiento del problema, y alcanza su punto máximo en la presentación de tu solución.' },
          ],
          proTip:
            'La IA puede detectar cuando estás leyendo notas versus cuando hablas de forma natural. Las sesiones donde hablas libremente — aunque de forma imperfecta — producen retroalimentación más precisa y accionable.',
        },
        {
          heading: 'Aprovechando al Máximo tus Sesiones',
          para: 'El motor de retroalimentación es más valioso cuando tratas cada sesión como un experimento controlado.',
          bullets: [
            { label: 'Revisa, no reacciones', text: 'Lee el informe completo antes de hacer cambios. Los patrones en múltiples sesiones revelan debilidades reales, no ruido de sesión.' },
            { label: 'Enfócate en una métrica por sesión', text: 'Intentar corregir todo a la vez rara vez funciona. Elige la dimensión con menor puntaje y construye una sesión enfocada en mejorarla.' },
            { label: 'Usa la transcripción', text: 'Las secciones resaltadas en la transcripción corresponden directamente a los momentos que impulsaron tus puntajes — tanto positivos como negativos.' },
            { label: 'Sigue la tendencia, no el puntaje', text: 'Un solo puntaje es un punto de datos. Tres sesiones consecutivas muestran un patrón. Ejecuta al menos tres sesiones antes de sacar conclusiones.' },
          ],
        },
      ],
    },

    'investor-questions': {
      intro:
        'Los capitalistas de riesgo tienen un guion. Las preguntas que hacen no son aleatorias — están diseñadas para poner a prueba tus suposiciones y revelar qué tan profundamente entiendes tu negocio. Este banco cubre las preguntas que los VCs hacen con más frecuencia, organizadas por categoría.',
      sections: [
        {
          heading: 'Estrategia GTM',
          para: 'Estas preguntas indagan si tienes un camino claro y repetible para adquirir y retener clientes.',
          bullets: [
            { label: 'Definición del ICP', text: '¿Quién es tu cliente ideal — no solo demográfico, sino psicográfico? ¿Qué dolor específico los hace comprar hoy en lugar del próximo trimestre?' },
            { label: 'Primeros 10 Clientes', text: '¿Cómo los conseguiste y qué dice el método de adquisición sobre la repetibilidad a escala?' },
            { label: 'CAC y Período de Recuperación', text: '¿Cuál es tu costo de adquisición de clientes y período de recuperación? ¿Cómo cambia al pasar de ventas lideradas por el fundador a un canal de distribución escalado?' },
            { label: 'Ganarle a la Inacción', text: '¿Cómo ganas contra la opción predeterminada — no hacer nada? ¿Qué desencadena la decisión de comprar ahora?' },
          ],
          proTip:
            'No solo memorices respuestas. Los mejores fundadores pueden responder preguntas de seguimiento que no están en ninguna lista. Practica el razonamiento subyacente, no la respuesta superficial.',
        },
        {
          heading: 'Defensibilidad',
          para: 'Los inversores quieren saber que el negocio que financian hoy será difícil de copiar en tres años.',
          bullets: [
            { label: 'Ventaja en 3 Años', text: '¿Tu ventaja es la acumulación de datos, costos de cambio, efectos de red o marca? ¿Cuál de estos se acumula más rápido en tu mercado?' },
            { label: 'Competidor Bien Financiado', text: '¿Qué pasa si un competidor con $50M copia tu producto exactamente mañana? ¿Qué seguiría faltándole?' },
            { label: 'Activos Propietarios', text: '¿Tienes IP, datasets exclusivos o alianzas que los competidores no puedan replicar fácilmente?' },
            { label: 'Defensibilidad Compuesta', text: '¿Tu ventaja se vuelve más fuerte a medida que consigues más clientes? Si no, ¿cuál es el plan para construir esa dinámica?' },
          ],
        },
        {
          heading: 'Ventaja Técnica',
          para: 'Para los fundadores técnicos, esta es el área donde tienes más credibilidad — y más riesgo de ir demasiado en profundidad.',
          bullets: [
            { label: 'Diferenciación 10x', text: '¿Qué hace que tu enfoque técnico sea 10x mejor — no solo diferente? "Mejor" debe traducirse en un resultado de negocio medible.' },
            { label: 'La Prueba del Código Abierto', text: 'Si abrieras tu algoritmo central mañana, ¿cuánto tardaría un competidor bien financiado en alcanzarte? ¿Qué seguiría faltándole?' },
            { label: 'Datos Propietarios', text: '¿A qué datos tienes acceso que otros no tienen? ¿Cómo mejoran tu producto con el tiempo de una manera que los competidores no pueden replicar?' },
            { label: 'El Problema Más Difícil', text: '¿Cuál es el problema técnicamente más difícil que has resuelto y por qué resolverlo importa para el negocio y para el cliente?' },
          ],
        },
      ],
    },

    'public-speaking': {
      intro:
        'La mayoría de los fundadores técnicos no tienen un problema de contenido — tienen un problema de presentación. Las ideas están ahí, pero la forma en que se comunican crea fricción. Estas técnicas están diseñadas para personas que son excelentes construyendo pero menos cómodas actuando.',
      sections: [
        {
          heading: 'Control de Respiración',
          para: 'Tu voz es un instrumento físico. Controlar tu respiración controla tu ritmo, tono y confianza percibida.',
          bullets: [
            { label: 'La Técnica 4-7-8', text: 'Antes de comenzar, inhala durante 4 conteos, retén durante 7, exhala durante 8. Esto activa tu sistema nervioso parasimpático y reduce el pico de adrenalina que causa una voz temblorosa.' },
            { label: 'Pausa Intencionalmente', text: 'La mayoría de los oradores se apresuran porque el silencio se siente como fracaso. Una pausa deliberada de 2 segundos después de un punto clave se lee como confianza, no como duda.' },
            { label: 'Respira en la Puntuación', text: 'Entrénate para inhalar en las comas y exhalar en los puntos. Esto controla naturalmente tu ritmo y evita que encadenes oraciones.' },
          ],
          proTip:
            'Grábate con tu teléfono durante la práctica, luego míralo en silencio. Detectarás problemas de lenguaje corporal — brazos cruzados, ojos desviados, movimientos nerviosos — que no puedes sentir cuando estás en el momento.',
        },
        {
          heading: 'Ritmo para Complejidad Técnica',
          para: 'La velocidad es el error de presentación más común. Los fundadores se apresuran en el contenido técnico porque lo han escuchado cien veces — pero la audiencia lo está encontrando por primera vez.',
          bullets: [
            { label: 'Reduce la Velocidad en Partes Difíciles', text: 'Contrariamente a la intuición, reducir la velocidad en tus explicaciones más técnicas señala confianza. Apresurarse señala ansiedad.' },
            { label: 'Analogías como Anclas', text: 'Cuando despliegas un concepto complejo, inmediatamente sigue con "Piénsalo como...". Esto le da a la audiencia un punto de apoyo mental antes de continuar.' },
            { label: 'Fragmenta tu Información', text: 'Nunca entregues más de tres puntos relacionados sin una pausa o resumen breve. Agrupa, pausa, continúa.' },
          ],
        },
        {
          heading: 'Presencia Escénica en el Q&A',
          para: 'El Q&A es donde los pitches se ganan y se pierden. La preparación y la estructura importan más que la espontaneidad.',
          bullets: [
            { label: 'El Marco PREP', text: 'Para cada pregunta: enuncia tu Punto, explica la Razón, da un Ejemplo, luego reafirma el Punto. Esta estructura previene divagaciones y señala claridad de pensamiento.' },
            { label: 'Maneja la Pregunta Hostil', text: 'Cuando una pregunta se siente adversarial, no te defiendas — reencuádrala. "Es una preocupación importante. Así es como lo hemos pensado." Luego responde directamente.' },
            { label: 'Tus Tres Puntos No Negociables', text: 'Siempre hay 3 puntos que no puedes permitirte dejar la sala sin mencionar. Si el Q&A se extiende, encuentra una apertura natural para incluirlos.' },
          ],
        },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Article renderer
// ---------------------------------------------------------------------------
function renderArticle(articleData, proTipLabel) {
  if (!articleData) return null;
  return (
    <>
      <p className="text-slate-400 leading-relaxed mb-6 text-lg">{articleData.intro}</p>
      {articleData.sections.map((section, si) => (
        <React.Fragment key={si}>
          <h2 className="text-2xl font-bold text-white mt-12 mb-6 tracking-tight">{section.heading}</h2>
          {section.para && (
            <p className="text-slate-400 leading-relaxed mb-6 text-lg">{section.para}</p>
          )}
          {section.bullets?.length > 0 && (
            <ul className="mb-8 space-y-3">
              {section.bullets.map((b, bi) => (
                <li key={bi} className="text-slate-400 flex items-start gap-3 text-lg">
                  <span className="text-[#7C5CFF] font-bold shrink-0">•</span>
                  <span>
                    <strong className="text-white">{b.label}:</strong> {b.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {section.proTip && (
            <div className="bg-[#12121A] border-l-4 border-[#7C5CFF] p-6 my-10 rounded-r-lg">
              <div className="flex items-center gap-2 mb-2 text-[#7C5CFF]">
                <span className="material-symbols-outlined">lightbulb</span>
                <span className="font-bold uppercase tracking-wider text-xs">{proTipLabel}</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{section.proTip}</p>
            </div>
          )}
        </React.Fragment>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const defaultResource = {
  id: 'pitch-templates',
  title: 'Pitch Templates for Technical Founders',
  category: 'Documentation',
  readTime: '5 min read',
  lastUpdated: 'Oct 2023',
  author: 'PitchPilot Editorial',
};

export default function ResourceDetail({
  resource = defaultResource,
  language = 'en',
  onBack = () => {},
  onStartSession = () => {},
  onNavInstructions = () => {},
  onNavReporting = () => {},
}) {
  const ui = UI[language] || UI.en;
  const articlesByLang = ARTICLES[language] || ARTICLES.en;
  const articleData = articlesByLang[resource.id] || null;

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0B0F] text-slate-100">
      <Header
        activePage="resources"
        onNavInstructions={onNavInstructions}
        onNavReporting={onNavReporting}
        onStartSession={onStartSession}
      />

      {/* Main */}
      <main className="flex-1 w-full">
        {/* Title Section */}
        <div className="max-w-3xl mx-auto px-8 pt-12 pb-8">
          {/* Back button + Breadcrumb */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
            </button>
            <nav className="flex items-center gap-2 text-slate-500 text-sm">
              <button onClick={onBack} className="hover:text-[#7C5CFF] transition-colors">
                {ui.breadcrumbResources}
              </button>
              <span className="material-symbols-outlined text-xs">chevron_right</span>
              <span className="text-slate-300 truncate">{resource.title}</span>
            </nav>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            {resource.title}
          </h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-6 text-slate-500 text-sm border-b border-white/5 pb-10">
            {resource.readTime && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">schedule</span>
                <span>{resource.readTime}</span>
              </div>
            )}
            {resource.lastUpdated && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">calendar_today</span>
                <span>{ui.lastUpdated}: {resource.lastUpdated}</span>
              </div>
            )}
            {resource.author && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">person</span>
                <span>{ui.by} {resource.author}</span>
              </div>
            )}
          </div>
        </div>

        {/* Article Content */}
        <article className="max-w-3xl mx-auto px-8 pb-20">
          {renderArticle(articleData, ui.proTipLabel)}

          {/* CTA Section */}
          <div className="mt-16 pt-10 border-t border-white/5">
            <div className="bg-[#7C5CFF]/5 border border-[#7C5CFF]/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-white mt-0 mb-2">{ui.ctaTitle}</h3>
                <p className="text-slate-400 text-sm mb-0">{ui.ctaDescription}</p>
              </div>
              <button
                onClick={onStartSession}
                className="whitespace-nowrap bg-[#7C5CFF] text-white font-bold px-8 py-3 rounded-lg hover:shadow-[0_0_20px_rgba(124,92,255,0.3)] transition-all"
              >
                {ui.ctaButton}
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
              <button className="text-slate-500 text-sm hover:text-white transition-colors">{ui.glossary}</button>
              <button className="text-slate-500 text-sm hover:text-white transition-colors">{ui.apiDocs}</button>
              <button className="text-slate-500 text-sm hover:text-white transition-colors">{ui.privacy}</button>
            </div>
            <p className="text-slate-500 text-sm">{ui.footerCopy}</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
