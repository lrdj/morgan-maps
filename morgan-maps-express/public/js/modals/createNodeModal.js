import { getState, actions } from '../state.js';
import {
  NODE_TYPES, NODE_TYPE_LABELS, STATUSES,
  getAutomationLabel, getCriticalityLabel,
} from '../constants.js';
import { computeStepNumbers } from '../stepNumbers.js';
import { icons } from '../icons.js';

let host;

export function mountCreateNodeModalHost(hostEl) { host = hostEl; }

export function openCreateNodeModal(editNodeId = null) {
  const s = getState();
  const existing = editNodeId ? s.nodes.find((n) => n.id === editNodeId) : null;
  const stepNumbers = computeStepNumbers(s.nodes, s.edges);
  const autoStep = editNodeId ? stepNumbers[editNodeId] : undefined;

  let form = existing ? {
    title: existing.data.title,
    description: existing.data.description,
    nodeType: existing.data.nodeType,
    owner: existing.data.owner,
    organisation: existing.data.organisation,
    tags: [...existing.data.tags],
    status: existing.data.status,
    confidenceScore: existing.data.confidenceScore,
    notes: existing.data.notes,
    automationLevel: existing.data.automationLevel,
    criticalityLevel: existing.data.criticalityLevel,
    stepOverride: existing.data.stepOverride ?? null,
  } : {
    title: '', description: '', nodeType: 'execution',
    owner: '', organisation: '', tags: [], status: 'active',
    confidenceScore: 0.7, notes: '',
    automationLevel: 0.5, criticalityLevel: 0.5,
    stepOverride: null,
  };

  let tagInput = '';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  host.appendChild(overlay);

  function close() { overlay.remove(); }

  function render() {
    overlay.innerHTML = `
      <div class="modal modal--node">
        <div class="modal-header">
          <h2 class="modal-header__title">${editNodeId ? 'Edit Node' : 'Create Node'}</h2>
          <button class="icon-btn" id="close-x">${icons.x(16)}</button>
        </div>
        <div class="modal-body">
          <div>
            <label class="field-label">Title <span class="required">*</span></label>
            <input class="text-input" id="f-title" value="${escapeAttr(form.title)}" placeholder="Node title" />
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
              <label class="field-label" style="margin:0;">Step number</label>
              ${autoStep ? `<span style="font-size:10px;color:var(--gray-400);">Auto: <span style="font-weight:600;color:var(--gray-600);">${escapeHtml(autoStep)}</span></span>` : ''}
            </div>
            <input class="text-input" id="f-step" value="${escapeAttr(form.stepOverride ?? '')}" placeholder="${autoStep ? `Auto (${escapeAttr(autoStep)}) — type to override, clear to restore` : 'e.g. 1, 2a, 3 — leave blank for auto'}" />
            <p class="helper-text">Leave blank to auto-derive from flow edges. Set to a space to suppress the number entirely.</p>
          </div>
          <div class="field-grid-2">
            <div>
              <label class="field-label">Node Type</label>
              <select class="select-input" id="f-type">
                ${NODE_TYPES.map((t) => `<option value="${t}" ${form.nodeType === t ? 'selected' : ''}>${NODE_TYPE_LABELS[t]}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="field-label">Status</label>
              <select class="select-input" id="f-status">
                ${STATUSES.map((s) => `<option value="${s}" ${form.status === s ? 'selected' : ''}>${capitalise(s)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="field-grid-2">
            <div>
              <label class="field-label">Organisation</label>
              <input class="text-input" id="f-org" value="${escapeAttr(form.organisation)}" placeholder="e.g. DWP, HMRC" />
            </div>
            <div>
              <label class="field-label">Owner</label>
              <input class="text-input" id="f-owner" value="${escapeAttr(form.owner)}" placeholder="Team or person" />
            </div>
          </div>
          <div>
            <label class="field-label">Description</label>
            <textarea class="text-area" id="f-desc" rows="2" placeholder="What does this node do?">${escapeHtml(form.description)}</textarea>
          </div>

          ${slider('Automation', getAutomationLabel(form.automationLevel), 'purple', 'f-auto', Math.round(form.automationLevel * 4), 0, 4, 1, 'Human-led', 'Fully automated')}
          ${slider('Criticality', `${Math.round(form.criticalityLevel * 100)}% — ${getCriticalityLabel(form.criticalityLevel)}`, 'red', 'f-crit', Math.round(form.criticalityLevel * 100), 0, 100, 1, 'Low trust needed', 'High trust needed')}
          ${slider('Mapping confidence', `${Math.round(form.confidenceScore * 100)}%`, 'blue', 'f-conf', Math.round(form.confidenceScore * 100), 0, 100, 1, 'Tentative', 'High confidence')}

          <div>
            <label class="field-label">Tags</label>
            <div class="tag-chips">
              ${form.tags.map((t) => `<span class="tag-chip">${escapeHtml(t)}<button class="tag-remove" data-tag="${escapeAttr(t)}">×</button></span>`).join('')}
            </div>
            <input class="text-input" id="f-tag-input" value="${escapeAttr(tagInput)}" placeholder="Add tags (comma-separated or press Enter)" />
          </div>
          <div>
            <label class="field-label">Notes</label>
            <textarea class="text-area" id="f-notes" rows="2" placeholder="Internal notes or observations">${escapeHtml(form.notes)}</textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn--ghost" id="cancel-btn">Cancel</button>
          <button class="btn btn--primary" id="submit-btn" ${form.title.trim() ? '' : 'disabled'}>${editNodeId ? 'Save Changes' : 'Create Node'}</button>
        </div>
      </div>
    `;

    overlay.querySelector('#close-x').addEventListener('click', close);
    overlay.querySelector('#cancel-btn').addEventListener('click', close);
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });

    bind('#f-title',  'input',  (e) => { form.title = e.target.value; updateSubmitDisabled(); });
    bind('#f-step',   'input',  (e) => { form.stepOverride = e.target.value || null; });
    bind('#f-type',   'change', (e) => { form.nodeType = e.target.value; });
    bind('#f-status', 'change', (e) => { form.status = e.target.value; });
    bind('#f-org',    'input',  (e) => { form.organisation = e.target.value; });
    bind('#f-owner',  'input',  (e) => { form.owner = e.target.value; });
    bind('#f-desc',   'input',  (e) => { form.description = e.target.value; });
    bind('#f-notes',  'input',  (e) => { form.notes = e.target.value; });

    bind('#f-auto', 'input', (e) => {
      form.automationLevel = Number(e.target.value) / 4;
      updateSliderLabel('f-auto', getAutomationLabel(form.automationLevel));
    });
    bind('#f-crit', 'input', (e) => {
      form.criticalityLevel = Number(e.target.value) / 100;
      updateSliderLabel('f-crit', `${Math.round(form.criticalityLevel * 100)}% — ${getCriticalityLabel(form.criticalityLevel)}`);
    });
    bind('#f-conf', 'input', (e) => {
      form.confidenceScore = Number(e.target.value) / 100;
      updateSliderLabel('f-conf', `${Math.round(form.confidenceScore * 100)}%`);
    });

    overlay.querySelectorAll('.tag-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        form.tags = form.tags.filter((t) => t !== btn.dataset.tag);
        render();
      });
    });
    bind('#f-tag-input', 'input', (e) => { tagInput = e.target.value; });
    bind('#f-tag-input', 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        tagInput.split(',').forEach((t) => {
          const tt = t.trim();
          if (tt && !form.tags.includes(tt)) form.tags.push(tt);
        });
        tagInput = '';
        render();
      }
    });

    overlay.querySelector('#submit-btn').addEventListener('click', () => {
      if (!form.title.trim()) return;
      if (editNodeId) {
        actions.updateNode(editNodeId, { ...form, overlays: existing?.data.overlays ?? {} });
      } else {
        actions.addNode({ ...form, overlays: {} });
      }
      close();
    });
  }

  function bind(sel, ev, fn) {
    const el = overlay.querySelector(sel);
    if (el) el.addEventListener(ev, fn);
  }
  function updateSubmitDisabled() {
    const btn = overlay.querySelector('#submit-btn');
    if (btn) btn.disabled = !form.title.trim();
  }
  function updateSliderLabel(sliderId, value) {
    const el = overlay.querySelector(`#${sliderId}`);
    if (!el) return;
    const valEl = el.closest('div').querySelector('.slider-row__value');
    if (valEl) valEl.textContent = value;
  }

  render();
}

function slider(label, valueLabel, color, id, value, min, max, step, leftLabel, rightLabel) {
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

function capitalise(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
