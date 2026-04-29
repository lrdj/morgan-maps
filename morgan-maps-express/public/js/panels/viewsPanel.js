import { getState, subscribe, actions } from '../state.js';
import { NODE_TYPES, NODE_TYPE_LABELS } from '../constants.js';
import { icons } from '../icons.js';

let host;
let owned = false;

export function mountViewsPanel(hostEl) {
  host = hostEl;
  subscribe(() => maybeRender());
}

function maybeRender() {
  const s = getState();
  if (s.activePanel === 'views') {
    owned = true;
    render();
  } else if (owned) {
    host.innerHTML = '';
    owned = false;
  }
}

function render() {
  const s = getState();
  const f = s.filters;
  const allOrgs = [...new Set(s.nodes.map((n) => n.data.organisation).filter(Boolean))].sort();
  const allTags = [...new Set(s.nodes.flatMap((n) => n.data.tags))].sort();

  const hasActive =
    f.nodeTypes.length > 0 || f.organisations.length > 0 || f.tags.length > 0 ||
    f.criticalityRange[0] > 0 || f.criticalityRange[1] < 1 ||
    f.automationRange[0] > 0 || f.automationRange[1] < 1;

  host.innerHTML = `
    <div class="side-panel side-panel--views">
      <div class="panel-header">
        <div class="panel-header__title-group">
          <span style="color:var(--blue-500);display:inline-flex;">${icons.sliders(15)}</span>
          <h2 class="panel-header__title">Filters</h2>
          ${hasActive ? '<span class="filter-pill">on</span>' : ''}
        </div>
        <button class="icon-btn" id="close-views">${icons.x(15)}</button>
      </div>

      <div class="panel-body">
        <button class="reset-btn" id="reset-filters" ${hasActive ? '' : 'disabled'}>Reset all filters</button>

        <div>
          <div class="section-title">Display</div>
          <label class="checkbox-row">
            <input type="checkbox" id="show-steps" ${s.showStepNumbers ? 'checked' : ''} />
            <span style="color:var(--gray-500);display:inline-flex;">${icons.listOrdered(12)}</span>
            <span>Show step numbers</span>
          </label>
        </div>

        <div>
          <div class="section-title">Node Types</div>
          <div class="checkbox-grid">
            ${NODE_TYPES.map((t) => `
              <label class="checkbox-row">
                <input type="checkbox" data-node-type="${t}" ${f.nodeTypes.includes(t) ? 'checked' : ''} />
                <span>${NODE_TYPE_LABELS[t]}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div>
          <div class="filter-section-header">
            <span>Criticality Range</span>
            <span>${Math.round(f.criticalityRange[0] * 100)}% – ${Math.round(f.criticalityRange[1] * 100)}%</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <div class="range-row">
              <span class="range-row__bound">min</span>
              <input type="range" min="0" max="100" value="${Math.round(f.criticalityRange[0] * 100)}" id="crit-min" class="thumb-red" />
            </div>
            <div class="range-row">
              <span class="range-row__bound">max</span>
              <input type="range" min="0" max="100" value="${Math.round(f.criticalityRange[1] * 100)}" id="crit-max" class="thumb-red" />
            </div>
          </div>
        </div>

        <div>
          <div class="filter-section-header">
            <span>Automation Range</span>
            <span>${Math.round(f.automationRange[0] * 100)}% – ${Math.round(f.automationRange[1] * 100)}%</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <div class="range-row">
              <span class="range-row__bound">min</span>
              <input type="range" min="0" max="100" value="${Math.round(f.automationRange[0] * 100)}" id="auto-min" class="thumb-purple" />
            </div>
            <div class="range-row">
              <span class="range-row__bound">max</span>
              <input type="range" min="0" max="100" value="${Math.round(f.automationRange[1] * 100)}" id="auto-max" class="thumb-purple" />
            </div>
          </div>
        </div>

        ${allOrgs.length ? `
          <div>
            <div class="section-title">Organisations</div>
            <div class="org-list">
              ${allOrgs.map((o) => `
                <label class="checkbox-row">
                  <input type="checkbox" data-org="${escapeAttr(o)}" ${f.organisations.includes(o) ? 'checked' : ''} />
                  <span>${escapeHtml(o)}</span>
                </label>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${allTags.length ? `
          <div>
            <div class="section-title">Tags</div>
            <div class="tag-list">
              ${allTags.map((t) => `<button class="tag-pill ${f.tags.includes(t) ? 'is-active' : ''}" data-tag="${escapeAttr(t)}">${escapeHtml(t)}</button>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  host.querySelector('#close-views')?.addEventListener('click', () => actions.setActivePanel('none'));
  host.querySelector('#reset-filters')?.addEventListener('click', () => actions.resetFilters());

  host.querySelector('#show-steps')?.addEventListener('change', () => actions.toggleShowStepNumbers());

  host.querySelectorAll('[data-node-type]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const t = cb.dataset.nodeType;
      const cur = getState().filters.nodeTypes;
      const next = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t];
      actions.setFilters({ nodeTypes: next });
    });
  });
  host.querySelectorAll('[data-org]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const o = cb.dataset.org;
      const cur = getState().filters.organisations;
      const next = cur.includes(o) ? cur.filter((x) => x !== o) : [...cur, o];
      actions.setFilters({ organisations: next });
    });
  });
  host.querySelectorAll('[data-tag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.tag;
      const cur = getState().filters.tags;
      const next = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t];
      actions.setFilters({ tags: next });
    });
  });

  bindRange('#crit-min', (val) => {
    const [, hi] = getState().filters.criticalityRange;
    if (val <= hi) actions.setFilters({ criticalityRange: [val, hi] });
  });
  bindRange('#crit-max', (val) => {
    const [lo] = getState().filters.criticalityRange;
    if (val >= lo) actions.setFilters({ criticalityRange: [lo, val] });
  });
  bindRange('#auto-min', (val) => {
    const [, hi] = getState().filters.automationRange;
    if (val <= hi) actions.setFilters({ automationRange: [val, hi] });
  });
  bindRange('#auto-max', (val) => {
    const [lo] = getState().filters.automationRange;
    if (val >= lo) actions.setFilters({ automationRange: [lo, val] });
  });
}

function bindRange(sel, fn) {
  const el = host.querySelector(sel);
  if (el) el.addEventListener('input', (e) => fn(Number(e.target.value) / 100));
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
