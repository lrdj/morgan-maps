import { X, HelpCircle, ExternalLink } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';

const EDGE_TYPES = [
  { type: 'Informs', color: '#94a3b8', dash: false, desc: 'Provides information, evidence, or signals that shape another element.' },
  { type: 'Triggers', color: '#3b82f6', dash: false, desc: 'An event or completion here causes another element to begin or activate.' },
  { type: 'Constrains', color: '#f43f5e', dash: true, desc: 'Sets rules, limits, or conditions that another element must operate within.' },
  { type: 'Transfers to', color: '#10b981', dash: true, desc: 'Passes work, responsibility, or an actionable result to another element.' },
  { type: 'Reviews', color: '#f59e0b', dash: true, desc: 'Checks, verifies, or quality-assures another element\'s output.' },
  { type: 'Escalates to', color: '#f97316', dash: false, desc: 'Passes work onward when complexity or exceptions require higher-level handling.' },
];

const NODE_TYPES = [
  { type: 'Decision',  color: '#f59e0b', desc: 'A point where a judgment, choice, determination, or classification is made.' },
  { type: 'Evidence',  color: '#14b8a6', desc: 'Information, signals, rules, records, or inputs used to support or shape a decision.' },
  { type: 'Execution', color: '#7c3aed', desc: 'An action that carries out, implements, or operationalises a decision.' },
  { type: 'Interface', color: '#3b82f6', desc: 'A touchpoint where a person gives input, receives output, or experiences part of the system.' },
];

const QUADRANTS = [
  { label: 'High criticality + low automation',  color: 'text-red-600',    bg: 'bg-red-50 border-red-100',       desc: 'Often where human judgment, discretion, or relationship management remain important.' },
  { label: 'High criticality + high automation', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100', desc: 'May be viable, but typically requires stronger assurance, monitoring, and explainability.' },
  { label: 'Low criticality + high automation',  color: 'text-green-600',  bg: 'bg-green-50 border-green-100',   desc: 'Often good candidates for standardisation, simplification, or full automation.' },
  { label: 'Low criticality + low automation',   color: 'text-gray-500',   bg: 'bg-gray-50 border-gray-200',     desc: 'May indicate manual work that could be reduced, redesigned, or questioned.' },
];

// Shared text styles for consistency
const SECTION_HEADING = 'text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3';
const BODY = 'text-[12px] leading-relaxed text-gray-600';
const BODY_MUTED = 'text-[12px] leading-relaxed text-gray-400';

export function HelpPanel() {
  const setActivePanel = useMapStore((s) => s.setActivePanel);

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 w-[380px] flex-shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <HelpCircle size={15} className="text-indigo-500" />
          <h2 className="text-sm font-semibold text-gray-800">Guide</h2>
        </div>
        <button
          onClick={() => setActivePanel('none')}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

        {/* What the map is for */}
        <section className="space-y-2">
          <h3 className={SECTION_HEADING}>What the map is for</h3>
          <p className={BODY}>
            The Morgan Map is a decision-centred way of understanding a service or system. It helps you analyse the elements involved in making, supporting, and carrying out decisions, according to how automatable they are and how critical they are to good outcomes and trust.
          </p>
          <p className={BODY}>
            As more services automate not just transactions but decisions, trust can no longer be treated as something separate from delivery. It has to be built into how decisions are made, evidenced, executed, and experienced. The map helps make that visible.
          </p>
          <p className={`${BODY_MUTED} !mt-3`}>Use it to:</p>
          <ul className="space-y-1.5 pl-4 list-disc">
            {[
              'understand where human judgment still matters',
              'identify where decisions can be safely automated',
              'see which elements are most important to trust in the outcome',
              'expose fragile dependencies between evidence, decisions, execution, and interfaces',
              'improve conversations about AI, service design, and transformation',
            ].map((item) => (
              <li key={item} className={BODY_MUTED}>{item}</li>
            ))}
          </ul>
        </section>

        <div className="border-t border-gray-100" />

        {/* Axes */}
        <section className="space-y-3">
          <h3 className={SECTION_HEADING}>The axes</h3>

          <div>
            <div className="text-[12px] font-semibold text-gray-700 mb-1">Automation →</div>
            <p className={BODY}>How far an element can be handled by software or machines rather than human effort.</p>
            <p className={`${BODY_MUTED} mt-1.5`}>This axis uses a simplified, practical version of levels of automation thinking — designed to support mapping and discussion, not technical precision:</p>
            <div className="mt-2 space-y-1.5">
              {[
                { label: 'Human-led',              desc: 'Done by people, with little or no automation' },
                { label: 'Assisted',               desc: 'People lead, with system support' },
                { label: 'Part-automated',         desc: 'Some parts are automated, but people still do key steps' },
                { label: 'Conditionally automated',desc: 'Automated in defined cases, with humans handling exceptions, thresholds, or oversight' },
                { label: 'Fully automated',        desc: 'Handled end-to-end by the system with minimal human involvement' },
              ].map(({ label, desc }) => (
                <div key={label} className="flex gap-2">
                  <span className="text-[11px] font-semibold text-gray-600 w-36 flex-shrink-0">{label}</span>
                  <span className="text-[11px] text-gray-400 leading-snug">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[12px] font-semibold text-gray-700 mb-1">Criticality ↑</div>
            <p className={BODY}>How much an element matters to getting the decision right and sustaining trust in the outcome — including its effect on quality, safety, fairness, and legitimacy.</p>
            <p className={`${BODY_MUTED} mt-1.5`}>An element is often critical because failure, opacity, or over-automation would damage trust — not just the result.</p>
            <div className="mt-2 space-y-1.5">
              {[
                { label: 'Routine',      desc: 'Low stakes. Failure has limited impact on the decision, outcome, or trust. Can usually be corrected without significant consequence.' },
                { label: 'Operational',  desc: 'Some consequence if this fails, but the overall decision or service can generally recover.' },
                { label: 'Important',    desc: 'Meaningful impact on outcomes or experience. Failure would affect quality, efficiency, or user trust to a noticeable degree.' },
                { label: 'High-impact',  desc: 'Significant consequence if this fails or is handled poorly. Would materially affect the decision, outcome, or confidence in the service.' },
                { label: 'Critical',     desc: 'Failure, opacity, or poor handling would seriously damage the quality of the decision, the outcome, or trust in the service. Often involves safety, fairness, legal obligation, or fundamental legitimacy.' },
              ].map(({ label, desc }) => (
                <div key={label} className="flex gap-2">
                  <span className="text-[11px] font-semibold text-gray-600 w-24 flex-shrink-0">{label}</span>
                  <span className="text-[11px] text-gray-400 leading-snug">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="border-t border-gray-100" />

        {/* Node types */}
        <section className="space-y-2">
          <h3 className={SECTION_HEADING}>Node types</h3>
          <p className={BODY_MUTED}>Not every node is itself a decision. Other node types are placed according to how much they matter to making, supporting, carrying, or executing a good decision.</p>
          {NODE_TYPES.map(({ type, color, desc }) => (
            <div key={type} className="flex gap-2.5 items-start">
              <span className="flex-shrink-0 w-2 h-2 rounded-sm mt-1" style={{ backgroundColor: color, opacity: 0.85 }} />
              <p className={BODY}>
                <span className="font-semibold text-gray-700">{type} — </span>
                {desc}
              </p>
            </div>
          ))}
        </section>

        <div className="border-t border-gray-100" />

        {/* Edge types */}
        <section className="space-y-2">
          <h3 className={SECTION_HEADING}>Edges</h3>
          <p className={BODY_MUTED}>Edges show meaningful relationships between elements.</p>
          {EDGE_TYPES.map(({ type, color, dash, desc }) => (
            <div key={type} className="flex gap-2.5 items-start">
              <div className="flex-shrink-0 flex items-center mt-1.5" style={{ width: 28 }}>
                <svg width="28" height="6">
                  <line x1="0" y1="3" x2="28" y2="3" stroke={color} strokeWidth={2} strokeDasharray={dash ? '5 3' : undefined} />
                </svg>
              </div>
              <p className={BODY}>
                <span className="font-semibold text-gray-700">{type} — </span>
                {desc}
              </p>
            </div>
          ))}
        </section>

        <div className="border-t border-gray-100" />

        {/* Mini worked example */}
        <section className="space-y-2">
          <h3 className={SECTION_HEADING}>Example chain</h3>
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex flex-col items-center gap-0.5">
                <div className="px-2.5 py-1 rounded border text-[10px] font-semibold" style={{ background: '#14b8a611', borderColor: '#14b8a6', color: '#0f766e' }}>Evidence</div>
                <span className="text-[9px] text-gray-400">case data</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <svg width="32" height="14"><line x1="0" y1="7" x2="26" y2="7" stroke="#94a3b8" strokeWidth="1.5"/><polygon points="26,4 32,7 26,10" fill="#94a3b8"/></svg>
                <span className="text-[9px] text-gray-400">informs</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="px-2.5 py-1 rounded border text-[10px] font-semibold" style={{ background: '#f59e0b11', borderColor: '#f59e0b', color: '#b45309' }}>Decision</div>
                <span className="text-[9px] text-gray-400">eligibility</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <svg width="32" height="14"><line x1="0" y1="7" x2="26" y2="7" stroke="#3b82f6" strokeWidth="1.5"/><polygon points="26,4 32,7 26,10" fill="#3b82f6"/></svg>
                <span className="text-[9px] text-gray-400">triggers</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div className="px-2.5 py-1 rounded border text-[10px] font-semibold" style={{ background: '#7c3aed11', borderColor: '#7c3aed', color: '#6d28d9' }}>Execution</div>
                <span className="text-[9px] text-gray-400">issue letter</span>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-1.5">
              <svg width="14" height="22" className="flex-shrink-0 mt-1"><line x1="7" y1="0" x2="7" y2="22" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 2"/></svg>
              <div>
                <span className="inline-flex px-2.5 py-0.5 rounded border text-[10px] font-semibold" style={{ background: '#3b82f611', borderColor: '#3b82f6', color: '#1d4ed8' }}>Interface</span>
                <span className="text-[10px] text-gray-400 ml-1.5">— captures input, presents outcome</span>
              </div>
            </div>
          </div>
        </section>

        <div className="border-t border-gray-100" />

        {/* How to use */}
        <section className="space-y-2">
          <h3 className={SECTION_HEADING}>How to use the map</h3>
          <ol className="space-y-1.5 pl-4 list-decimal">
            {[
              'Add nodes for the important elements of a service or workflow',
              'Position them by automation (left–right) and criticality (bottom–top)',
              'Connect them to show how information, decisions, actions, and interfaces relate',
              'Use the map to identify automation candidates, bottlenecks, hidden judgment, and trust-sensitive points',
            ].map((item) => (
              <li key={item} className={BODY_MUTED}>{item}</li>
            ))}
          </ol>
        </section>

        <div className="border-t border-gray-100" />

        {/* How to read */}
        <section className="space-y-2">
          <h3 className={SECTION_HEADING}>How to read the map</h3>
          {QUADRANTS.map(({ label, color, bg, desc }) => (
            <div key={label} className={`rounded-lg border px-3 py-2.5 ${bg}`}>
              <div className={`text-[12px] font-semibold mb-0.5 ${color}`}>{label}</div>
              <p className="text-[12px] leading-relaxed text-gray-500">{desc}</p>
            </div>
          ))}
          <p className={BODY_MUTED}>
            An element may sit high on the map because it carries high trust requirements, even if it is not itself the final decision.
          </p>
        </section>

        <div className="border-t border-gray-100" />

        {/* Generate with AI */}
        <section className="space-y-2">
          <h3 className={SECTION_HEADING}>Generate maps with an AI assistant</h3>
          <p className={BODY}>
            You can ask ChatGPT, Claude, or any LLM to generate a map for you. Point it at the resources below and ask it to produce a JSON file you can import.
          </p>
          <p className={BODY_MUTED}>
            Example prompt: <span className="italic">"Using the schema at https://tomwm-lab.vercel.app/morgan-map/schema.json and the guide at https://tomwm-lab.vercel.app/morgan-map/llm-guide.md, create a Morgan Map JSON file for [service name]. Use only publicly known information."</span>
          </p>
          <div className="space-y-1.5 pt-1">
            <a
              href="https://tomwm-lab.vercel.app/morgan-map/schema.json"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[12px] text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ExternalLink size={11} />
              schema.json — full JSON Schema
            </a>
            <a
              href="https://tomwm-lab.vercel.app/morgan-map/llm-guide.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[12px] text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ExternalLink size={11} />
              llm-guide.md — plain-text guide for LLMs
            </a>
          </div>
        </section>

        <div className="h-4" />
      </div>
    </div>
  );
}
