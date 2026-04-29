import { getState, subscribe, actions } from '../state.js';
import { icons } from '../icons.js';

let host;
let owned = false;

const EDGE_TYPES = [
  { type: 'Informs',      color: '#94a3b8', dash: false, desc: 'Provides information, evidence, or signals that shape another element.' },
  { type: 'Triggers',     color: '#3b82f6', dash: false, desc: 'An event or completion here causes another element to begin or activate.' },
  { type: 'Constrains',   color: '#f43f5e', dash: true,  desc: 'Sets rules, limits, or conditions that another element must operate within.' },
  { type: 'Transfers to', color: '#10b981', dash: true,  desc: 'Passes work, responsibility, or an actionable result to another element.' },
  { type: 'Reviews',      color: '#f59e0b', dash: true,  desc: "Checks, verifies, or quality-assures another element's output." },
  { type: 'Escalates to', color: '#f97316', dash: false, desc: 'Passes work onward when complexity or exceptions require higher-level handling.' },
];

const NODE_TYPES_HELP = [
  { type: 'Decision',  color: '#f59e0b', desc: 'A point where a judgment, choice, determination, or classification is made.' },
  { type: 'Evidence',  color: '#14b8a6', desc: 'Information, signals, rules, records, or inputs used to support or shape a decision.' },
  { type: 'Execution', color: '#7c3aed', desc: 'An action that carries out, implements, or operationalises a decision.' },
  { type: 'Interface', color: '#3b82f6', desc: 'A touchpoint where a person gives input, receives output, or experiences part of the system.' },
];

const QUADRANTS = [
  { label: 'High criticality + low automation',  cls: 'quad-red',    desc: 'Often where human judgment, discretion, or relationship management remain important.' },
  { label: 'High criticality + high automation', cls: 'quad-orange', desc: 'May be viable, but typically requires stronger assurance, monitoring, and explainability.' },
  { label: 'Low criticality + high automation',  cls: 'quad-green',  desc: 'Often good candidates for standardisation, simplification, or full automation.' },
  { label: 'Low criticality + low automation',   cls: 'quad-gray',   desc: 'May indicate manual work that could be reduced, redesigned, or questioned.' },
];

export function mountHelpPanel(hostEl) {
  host = hostEl;
  subscribe(() => maybeRender());
}

function maybeRender() {
  const s = getState();
  if (s.activePanel === 'help') {
    owned = true;
    render();
  } else if (owned) {
    host.innerHTML = '';
    owned = false;
  }
}

function render() {
  host.innerHTML = `
    <div class="side-panel side-panel--help">
      <div class="panel-header">
        <div class="panel-header__title-group">
          <span style="color:var(--indigo-500);display:inline-flex;">${icons.helpCircle(15)}</span>
          <h2 class="panel-header__title">Guide</h2>
        </div>
        <button class="icon-btn" id="close-help">${icons.x(15)}</button>
      </div>

      <div class="panel-body">
        <section class="help-section">
          <h3>What the map is for</h3>
          <p>The Morgan Map is a decision-centred way of understanding a service or system. It helps you analyse the elements involved in making, supporting, and carrying out decisions, according to how automatable they are and how critical they are to good outcomes and trust.</p>
          <p>As more services automate not just transactions but decisions, trust can no longer be treated as something separate from delivery. It has to be built into how decisions are made, evidenced, executed, and experienced. The map helps make that visible.</p>
          <p class="help-muted" style="margin-top:12px;">Use it to:</p>
          <ul>
            <li>understand where human judgment still matters</li>
            <li>identify where decisions can be safely automated</li>
            <li>see which elements are most important to trust in the outcome</li>
            <li>expose fragile dependencies between evidence, decisions, execution, and interfaces</li>
            <li>improve conversations about AI, service design, and transformation</li>
          </ul>
        </section>

        <section class="help-section">
          <h3>The axes</h3>
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--gray-700);margin-bottom:4px;">Automation →</div>
            <p>How far an element can be handled by software or machines rather than human effort.</p>
            <p class="help-muted">This axis uses a simplified, practical version of levels of automation thinking — designed to support mapping and discussion, not technical precision:</p>
            ${[
              ['Human-led',              'Done by people, with little or no automation'],
              ['Assisted',               'People lead, with system support'],
              ['Part-automated',         'Some parts are automated, but people still do key steps'],
              ['Conditionally automated','Automated in defined cases, with humans handling exceptions, thresholds, or oversight'],
              ['Fully automated',        'Handled end-to-end by the system with minimal human involvement'],
            ].map(([l, d]) => `<div class="help-axis-row"><span class="help-axis-row__label">${l}</span><span class="help-axis-row__desc">${d}</span></div>`).join('')}
          </div>
          <div style="margin-top:12px;">
            <div style="font-size:12px;font-weight:600;color:var(--gray-700);margin-bottom:4px;">Criticality ↑</div>
            <p>How much an element matters to getting the decision right and sustaining trust in the outcome — including its effect on quality, safety, fairness, and legitimacy.</p>
            <p class="help-muted">An element is often critical because failure, opacity, or over-automation would damage trust — not just the result.</p>
            ${[
              ['Routine',     'Low stakes. Failure has limited impact on the decision, outcome, or trust. Can usually be corrected without significant consequence.'],
              ['Operational', 'Some consequence if this fails, but the overall decision or service can generally recover.'],
              ['Important',   'Meaningful impact on outcomes or experience. Failure would affect quality, efficiency, or user trust to a noticeable degree.'],
              ['High-impact', 'Significant consequence if this fails or is handled poorly. Would materially affect the decision, outcome, or confidence in the service.'],
              ['Critical',    'Failure, opacity, or poor handling would seriously damage the quality of the decision, the outcome, or trust in the service. Often involves safety, fairness, legal obligation, or fundamental legitimacy.'],
            ].map(([l, d]) => `<div class="help-axis-row"><span class="help-axis-row__label" style="width:96px;">${l}</span><span class="help-axis-row__desc">${d}</span></div>`).join('')}
          </div>
        </section>

        <section class="help-section">
          <h3>Node types</h3>
          <p class="help-muted">Not every node is itself a decision. Other node types are placed according to how much they matter to making, supporting, carrying, or executing a good decision.</p>
          ${NODE_TYPES_HELP.map(({ type, color, desc }) => `
            <div class="help-row-typed">
              <span class="help-row-typed__swatch" style="background:${color}"></span>
              <p><span style="font-weight:600;color:var(--gray-700)">${type} — </span>${desc}</p>
            </div>
          `).join('')}
        </section>

        <section class="help-section">
          <h3>Edges</h3>
          <p class="help-muted">Edges show meaningful relationships between elements.</p>
          ${EDGE_TYPES.map(({ type, color, dash, desc }) => `
            <div class="help-row-typed">
              <span class="help-row-typed__edge">
                <svg width="28" height="6"><line x1="0" y1="3" x2="28" y2="3" stroke="${color}" stroke-width="2" ${dash ? 'stroke-dasharray="5 3"' : ''} /></svg>
              </span>
              <p><span style="font-weight:600;color:var(--gray-700)">${type} — </span>${desc}</p>
            </div>
          `).join('')}
        </section>

        <section class="help-section">
          <h3>Example chain</h3>
          <div class="example-chain">
            <div class="example-chain__row">
              ${chainPill('Evidence', 'case data', '#14b8a611', '#14b8a6', '#0f766e')}
              ${chainArrow('#94a3b8', 'informs')}
              ${chainPill('Decision', 'eligibility', '#f59e0b11', '#f59e0b', '#b45309')}
              ${chainArrow('#3b82f6', 'triggers')}
              ${chainPill('Execution', 'issue letter', '#7c3aed11', '#7c3aed', '#6d28d9')}
            </div>
            <div style="display:flex;align-items:flex-start;gap:6px;margin-top:12px;">
              <svg width="14" height="22"><line x1="7" y1="0" x2="7" y2="22" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="3 2"/></svg>
              <div>
                <span style="display:inline-flex;padding:2px 10px;border-radius:4px;border:1px solid #3b82f6;background:#3b82f611;color:#1d4ed8;font-size:10px;font-weight:600;">Interface</span>
                <span style="font-size:10px;color:var(--gray-400);margin-left:6px;">— captures input, presents outcome</span>
              </div>
            </div>
          </div>
        </section>

        <section class="help-section">
          <h3>How to use the map</h3>
          <ol>
            <li>Add nodes for the important elements of a service or workflow</li>
            <li>Position them by automation (left–right) and criticality (bottom–top)</li>
            <li>Connect them to show how information, decisions, actions, and interfaces relate</li>
            <li>Use the map to identify automation candidates, bottlenecks, hidden judgment, and trust-sensitive points</li>
          </ol>
        </section>

        <section class="help-section">
          <h3>How to read the map</h3>
          ${QUADRANTS.map(({ label, cls, desc }) => `
            <div class="quadrant-card ${cls}">
              <div class="quadrant-card__label">${label}</div>
              <p class="quadrant-card__desc">${desc}</p>
            </div>
          `).join('')}
          <p class="help-muted">An element may sit high on the map because it carries high trust requirements, even if it is not itself the final decision.</p>
        </section>

        <section class="help-section">
          <h3>Generate maps with an AI assistant</h3>
          <p>You can ask ChatGPT, Claude, or any LLM to generate a map for you. Point it at the resources below and ask it to produce a JSON file you can import.</p>
          <p class="help-muted">Example prompt: <em>"Using the schema at https://tomwm-lab.vercel.app/morgan-map/schema.json and the guide at https://tomwm-lab.vercel.app/morgan-map/llm-guide.md, create a Morgan Map JSON file for [service name]. Use only publicly known information."</em></p>
          <div style="display:flex;flex-direction:column;gap:6px;margin-top:4px;">
            <a class="help-link" href="/schema.json" target="_blank" rel="noopener noreferrer">${icons.externalLink(11)} schema.json — full JSON Schema</a>
            <a class="help-link" href="/llm-guide.md" target="_blank" rel="noopener noreferrer">${icons.externalLink(11)} llm-guide.md — plain-text guide for LLMs</a>
          </div>
        </section>

        <div style="height:16px;"></div>
      </div>
    </div>
  `;

  host.querySelector('#close-help')?.addEventListener('click', () => actions.setActivePanel('none'));
}

function chainPill(label, caption, bg, border, fg) {
  return `<div class="example-pill">
    <span class="example-pill__chip" style="background:${bg};border-color:${border};color:${fg};">${label}</span>
    <span class="example-pill__caption">${caption}</span>
  </div>`;
}
function chainArrow(color, label) {
  return `<div class="example-pill">
    <svg width="32" height="14"><line x1="0" y1="7" x2="26" y2="7" stroke="${color}" stroke-width="1.5"/><polygon points="26,4 32,7 26,10" fill="${color}"/></svg>
    <span class="example-pill__caption">${label}</span>
  </div>`;
}
