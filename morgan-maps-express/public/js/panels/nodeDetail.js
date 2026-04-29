import { getState, subscribe, actions } from '../state.js';
import {
  NODE_TYPE_COLOURS, NODE_TYPE_LABELS, NODE_TYPES, STATUSES,
  AUTOMATION_LABELS, CRITICALITY_LABELS,
  getAutomationLabel, getCriticalityLabel,
} from '../constants.js';
import { computeStepNumbers } from '../stepNumbers.js';
import { icons } from '../icons.js';

let host;
let editing = false;
let draft = {}; // partial NodeData
let prevSelectedId = null;
let owned = false; // we currently own the right-panel host

export function mountNodeDetail(hostEl) {
  host = hostEl;
  subscribe(() => maybeRender());
}

function maybeRender() {
  const s = getState();
  if (s.activePanel === 'node' && s.selectedNodeId) {
    if (s.selectedNodeId !== prevSelectedId) {
      editing = false;
      draft = {};
      prevSelectedId = s.selectedNodeId;
    }
    owned = true;
    render();
  } else if (owned) {
    host.innerHTML = '';
    owned = false;
    prevSelectedId = null;
    editing = false;
    draft = {};
  }
}

function render() {
  const s = getState();
  const node = s.nodes.find((n) => n.id === s.selectedNodeId);
  if (!node) { host.innerHTML = ''; return; }

  const d = node.data;
  const v = { ...d, ...draft };
  const colour = NODE_TYPE_COLOURS[d.nodeType];

  const stepNumbers = computeStepNumbers(s.nodes, s.edges);
  const autoStep = stepNumbers[node.id];

  const connectedEdges = s.edges.filter((e) => e.source === node.id || e.target === node.id);

  host.innerHTML = `
    <div class="side-panel side-panel--node">
      <div class="panel-header">
        <div style="flex:1;min-width:0;">
          <span class="detail-type-pill" style="background:${colour}22;color:${colour}">${NODE_TYPE_LABELS[d.nodeType]}</span>
          <h2 class="detail-title">${escapeHtml(d.title)}</h2>
          <p class="detail-org">${escapeHtml(d.organisation || '—')}</p>
        </div>
        <div class="detail-actions">
          ${editing ? `
            <button class="icon-btn" id="cancel" title="Cancel">${icons.x(15)}</button>
            <button class="btn btn--primary" id="save-btn" title="Save changes">${icons.check(13)} Save</button>
          ` : `
            <button class="icon-btn icon-btn--danger" id="delete" title="Delete node">${icons.trash(14)}</button>
            <button class="btn" id="edit-btn" title="Edit node">${icons.pencil(12)} Edit</button>
            <button class="icon-btn" id="close" title="Close">${icons.x(16)}</button>
          `}
        </div>
      </div>

      <div class="panel-body">
        ${editing ? renderEditForm(v, autoStep) : renderViewMode(d, autoStep, s.nodes, connectedEdges)}
      </div>
    </div>
  `;

  attachEvents(node, autoStep);
}

function renderViewMode(d, autoStep, allNodes, connectedEdges) {
  return `
    <div class="meta-grid">
      <div class="meta-card">
        <div class="meta-label">Status</div>
        <span class="status-pill status-pill--${d.status}">${capitalise(d.status)}</span>
      </div>
      <div class="meta-card">
        <div class="meta-label">Step</div>
        <div style="display:flex;align-items:center;gap:6px;">
          ${autoStep ? `<span class="node__step-badge" style="font-size:${autoStep.length > 2 ? '8px' : '9px'};min-width:18px;height:18px;">${escapeHtml(autoStep)}</span>` : ''}
          <span class="meta-value" style="color:var(--gray-500);">${
            d.stepOverride != null && String(d.stepOverride).trim() !== '' ? 'override' : autoStep ? 'auto' : '—'
          }</span>
        </div>
      </div>
      <div class="meta-card">
        <div class="meta-label">Owner</div>
        <span class="meta-value">${escapeHtml(d.owner || '—')}</span>
      </div>
      <div class="meta-card">
        <div class="meta-label">Confidence</div>
        ${confidenceBar(d.confidenceScore)}
      </div>
    </div>

    <div class="meta-card">
      <div class="meta-label" style="margin-bottom:8px;">Position on Map</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        <div class="meta-row">
          <span style="color:var(--gray-500);font-size:11px;">Automation</span>
          <span style="font-weight:600;color:var(--purple-600);font-size:11px;float:right;">${getAutomationLabel(d.automationLevel)}</span>
        </div>
        <div class="meta-row">
          <span style="color:var(--gray-500);font-size:11px;">Criticality / trust required</span>
          <span style="font-weight:600;color:var(--red-500);font-size:11px;float:right;">${Math.round(d.criticalityLevel * 100)}%</span>
        </div>
      </div>
    </div>

    <div>
      <div class="detail-section-title">Description</div>
      ${d.description
        ? `<p class="detail-text">${escapeHtml(d.description)}</p>`
        : `<p class="detail-text detail-text--muted">None — click Edit to add</p>`}
    </div>

    ${d.notes ? `
      <div>
        <div class="detail-section-title">Notes</div>
        <p class="detail-text">${escapeHtml(d.notes)}</p>
      </div>` : ''}

    ${d.tags.length ? `
      <div>
        <div class="detail-section-title" style="display:flex;align-items:center;gap:4px;">${icons.tag(10)} Tags</div>
        <div class="tag-list">
          ${d.tags.map((t) => `<span class="tag-chip">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>` : ''}

    <!-- connections section is appended by attachEvents (needs node.id) -->
  `;
}

function renderEditForm(v, autoStep) {
  return `
    <div>
      <label class="field-label">Title <span class="required">*</span></label>
      <input class="text-input" id="f-title" value="${escapeAttr(v.title)}" placeholder="Node title" />
    </div>

    <div>
      <label class="field-label">Step number</label>
      <input class="text-input" id="f-step" value="${escapeAttr(v.stepOverride ?? '')}" placeholder="${autoStep ? `Auto: ${escapeAttr(autoStep)} — leave blank to keep` : 'e.g. 1, 2a, 3b (leave blank for auto)'}" />
      <p class="helper-text">Leave blank to use the auto-derived step number. Clear to remove any override.</p>
    </div>

    <div class="field-grid-2">
      <div>
        <label class="field-label">Node Type</label>
        <select class="select-input" id="f-type">
          ${NODE_TYPES.map((t) => `<option value="${t}" ${v.nodeType === t ? 'selected' : ''}>${NODE_TYPE_LABELS[t]}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="field-label">Status</label>
        <select class="select-input" id="f-status">
          ${STATUSES.map((s) => `<option value="${s}" ${v.status === s ? 'selected' : ''}>${capitalise(s)}</option>`).join('')}
        </select>
      </div>
    </div>

    <div class="field-grid-2">
      <div>
        <label class="field-label">Organisation</label>
        <input class="text-input" id="f-org" value="${escapeAttr(v.organisation)}" placeholder="e.g. DWP, HMRC" />
      </div>
      <div>
        <label class="field-label">Owner</label>
        <input class="text-input" id="f-owner" value="${escapeAttr(v.owner)}" placeholder="Team or person" />
      </div>
    </div>

    <div>
      <label class="field-label">Description</label>
      <textarea class="text-area" id="f-desc" rows="2" placeholder="What does this node do?">${escapeHtml(v.description)}</textarea>
    </div>

    ${sliderRow('Automation', getAutomationLabel(v.automationLevel), 'purple', 'f-auto', Math.round(v.automationLevel * 4), 0, 4, 1, 'Human-led', 'Fully automated')}
    ${sliderRow('Criticality', `${Math.round(v.criticalityLevel * 100)}% — ${getCriticalityLabel(v.criticalityLevel)}`, 'red', 'f-crit', Math.round(v.criticalityLevel * 100), 0, 100, 1, 'Low trust needed', 'High trust needed')}
    ${sliderRow('Mapping confidence', `${Math.round(v.confidenceScore * 100)}%`, 'blue', 'f-conf', Math.round(v.confidenceScore * 100), 0, 100, 1, 'Tentative', 'High confidence')}

    <div>
      <label class="field-label">Tags</label>
      <div class="tag-chips">
        ${v.tags.map((t) => `<span class="tag-chip">${escapeHtml(t)}<button data-tag="${escapeAttr(t)}" class="tag-remove">×</button></span>`).join('')}
      </div>
      <input class="text-input" id="f-tag-input" placeholder="Add tags (comma-separated or press Enter)" />
    </div>

    <div>
      <label class="field-label">Notes</label>
      <textarea class="text-area" id="f-notes" rows="2" placeholder="Internal notes or observations">${escapeHtml(v.notes || '')}</textarea>
    </div>
  `;
}

function sliderRow(label, valueLabel, color, id, value, min, max, step, leftLabel, rightLabel) {
  return `
    <div>
      <div class="slider-row">
        <span class="slider-row__label">${label}</span>
        <span class="slider-row__value slider-row__value--${color}">${escapeHtml(valueLabel)}</span>
      </div>
      <input type="range" min="${min}" max="${max}" step="${step}" value="${value}" id="${id}" class="thumb-${color}" />
      <div class="slider-bottom-row"><span>${leftLabel}</span><span>${rightLabel}</span></div>
    </div>
  `;
}

function attachEvents(node, autoStep) {
  const $ = (sel) => host.querySelector(sel);

  $('#close')?.addEventListener('click', () => actions.selectNode(null));
  $('#delete')?.addEventListener('click', () => {
    if (confirm(`Delete node "${node.data.title}"?`)) actions.deleteNode(node.id);
  });
  $('#edit-btn')?.addEventListener('click', () => { editing = true; draft = {}; render(); });
  $('#cancel')?.addEventListener('click', () => { editing = false; draft = {}; render(); });
  $('#save-btn')?.addEventListener('click', () => {
    if (Object.keys(draft).length > 0) actions.updateNode(node.id, draft);
    editing = false; draft = {};
    render();
  });

  // Connections list — patch in here because rendering needed to look up otherId
  const sectionWrap = host.querySelector('.detail-section-title');
  // Simpler: re-render the connections inline
  if (!editing) {
    const body = host.querySelector('.panel-body');
    if (body) {
      const existingConnections = body.querySelector('[data-section="connections"]');
      if (existingConnections) existingConnections.remove();
      const allEdges = getState().edges.filter((e) => e.source === node.id || e.target === node.id);
      if (allEdges.length) {
        const wrap = document.createElement('div');
        wrap.dataset.section = 'connections';
        wrap.innerHTML = `
          <div class="detail-section-title">Connections (${allEdges.length})</div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            ${allEdges.map((edge) => {
              const isSource = edge.source === node.id;
              const otherId = isSource ? edge.target : edge.source;
              const other = getState().nodes.find((n) => n.id === otherId);
              return `<div class="connection-row">
                <span class="connection-row__arrow">${isSource ? '→' : '←'}</span>
                <span class="connection-row__title">${escapeHtml(other?.data.title ?? otherId)}</span>
                <span class="connection-row__rel">${edge.data?.relationshipType ?? ''}</span>
              </div>`;
            }).join('')}
          </div>
        `;
        body.appendChild(wrap);
      }
    }
  }

  if (editing) {
    bind('#f-title', 'input', (e) => { draft.title = e.target.value; });
    bind('#f-step', 'input', (e) => { draft.stepOverride = e.target.value || null; });
    bind('#f-type', 'change', (e) => { draft.nodeType = e.target.value; });
    bind('#f-status', 'change', (e) => { draft.status = e.target.value; });
    bind('#f-org', 'input', (e) => { draft.organisation = e.target.value; });
    bind('#f-owner', 'input', (e) => { draft.owner = e.target.value; });
    bind('#f-desc', 'input', (e) => { draft.description = e.target.value; });
    bind('#f-notes', 'input', (e) => { draft.notes = e.target.value; });

    // Sliders update immediately so position moves in real time.
    bind('#f-auto', 'input', (e) => {
      const val = Number(e.target.value) / 4;
      draft.automationLevel = val;
      actions.updateNode(node.id, { automationLevel: val });
      const valueEl = host.querySelector('#f-auto').closest('div').querySelector('.slider-row__value');
      if (valueEl) valueEl.textContent = getAutomationLabel(val);
    });
    bind('#f-crit', 'input', (e) => {
      const val = Number(e.target.value) / 100;
      draft.criticalityLevel = val;
      actions.updateNode(node.id, { criticalityLevel: val });
      const valueEl = host.querySelector('#f-crit').closest('div').querySelector('.slider-row__value');
      if (valueEl) valueEl.textContent = `${Math.round(val * 100)}% — ${getCriticalityLabel(val)}`;
    });
    bind('#f-conf', 'input', (e) => {
      const val = Number(e.target.value) / 100;
      draft.confidenceScore = val;
      const valueEl = host.querySelector('#f-conf').closest('div').querySelector('.slider-row__value');
      if (valueEl) valueEl.textContent = `${Math.round(val * 100)}%`;
    });

    // Tags
    host.querySelectorAll('.tag-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.tag;
        const cur = draft.tags ?? node.data.tags;
        const next = cur.filter((t) => t !== tag);
        draft.tags = next;
        actions.updateNode(node.id, { tags: next });
        render();
      });
    });
    bind('#f-tag-input', 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        const v = e.target.value.trim();
        if (!v) return;
        const cur = draft.tags ?? node.data.tags;
        if (cur.includes(v)) { e.target.value = ''; return; }
        const next = [...cur, v];
        draft.tags = next;
        actions.updateNode(node.id, { tags: next });
        e.target.value = '';
        render();
      }
    });
  }
}

function bind(sel, ev, fn) {
  const el = host.querySelector(sel);
  if (el) el.addEventListener(ev, fn);
}

function confidenceBar(value) {
  const pct = Math.round(value * 100);
  const colour = value > 0.7 ? '#10b981' : value > 0.5 ? '#f59e0b' : '#ef4444';
  return `<div class="confidence">
    <div class="confidence__track"><div class="confidence__fill" style="width:${pct}%;background:${colour};"></div></div>
    <span class="confidence__pct">${pct}%</span>
  </div>`;
}

function capitalise(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
