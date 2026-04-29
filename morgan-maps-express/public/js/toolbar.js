import { getState, subscribe, actions } from './state.js';
import { CANVAS_SIZE_PRESETS } from './constants.js';
import { exportToJSON, importFromJSON } from './exportImport.js';
import { saveMap } from './localSaves.js';
import { icons } from './icons.js';
import { openSavedMapsModal } from './modals/savedMapsModal.js';
import { openCreateNodeModal } from './modals/createNodeModal.js';

let host;
let editingName = false;
let nameDraft = '';
let showFileMenu = false;
let showCanvasMenu = false;
let saveFlash = false;

export function mountToolbar(hostEl) {
  host = hostEl;
  subscribe(render);
  render();
}

function render() {
  const s = getState();
  const hasFilters =
    s.filters.nodeTypes.length > 0 ||
    s.filters.organisations.length > 0 ||
    s.filters.tags.length > 0 ||
    s.filters.criticalityRange[0] > 0 || s.filters.criticalityRange[1] < 1 ||
    s.filters.automationRange[0] > 0 || s.filters.automationRange[1] < 1;

  host.innerHTML = `
    <div class="toolbar">
      <div class="toolbar__brand">
        <div class="toolbar__logo">${icons.map(14)}</div>
        <span class="toolbar__title">Morgan Map</span>
      </div>

      <div class="toolbar__name-area">
        ${editingName
          ? `<input class="toolbar__name-input" id="name-input" value="${escapeAttr(nameDraft)}" />`
          : `<button class="toolbar__name-button" id="name-button" title="Click to rename map">${escapeHtml(s.mapName)}</button>`}
        <span class="toolbar__counts">${s.nodes.length} nodes · ${s.edges.length} edges</span>
      </div>

      <div class="toolbar__spacer"></div>

      <div class="toolbar__actions">
        <button class="toolbar-btn toolbar-btn--primary" id="add-node">${icons.plus(13)} Add Node</button>
        <div class="toolbar__divider"></div>

        <div class="dropdown">
          <button class="toolbar-btn ${showCanvasMenu ? 'toolbar-btn--active-neutral' : ''}" id="canvas-menu-btn" title="Canvas size">
            ${icons.layoutGrid(13)} Canvas Size
            <span class="chev ${showCanvasMenu ? 'is-open' : ''}">${icons.chevronDown(11)}</span>
          </button>
          ${showCanvasMenu ? `
            <div class="dropdown__overlay" id="canvas-overlay"></div>
            <div class="dropdown__menu">
              ${CANVAS_SIZE_PRESETS.map((p) => {
                const active = s.canvasWidth === p.w && s.canvasHeight === p.h;
                return `<button class="dropdown__item ${active ? 'dropdown__item--checked' : ''}" data-size="${p.w}x${p.h}">
                          <span>${escapeHtml(p.label)}</span>
                          ${active ? icons.check(11) : ''}
                        </button>`;
              }).join('')}
            </div>` : ''}
        </div>

        <button class="toolbar-btn ${s.activePanel === 'views' ? 'toolbar-btn--active' : ''}" id="filters-btn" title="Toggle filters">
          ${icons.sliders(13)} Filters ${hasFilters ? '<span class="toolbar-btn__dot"></span>' : ''}
        </button>

        <div class="dropdown">
          <button class="toolbar-btn ${showFileMenu ? 'toolbar-btn--active-neutral' : ''}" id="file-menu-btn">
            ${saveFlash ? `<span class="toolbar-btn__saved-flash">${icons.check(13)}</span>` : icons.folderClosed(13)}
            ${saveFlash ? '<span class="toolbar-btn__saved-flash">Saved!</span>' : 'File'}
            <span class="chev ${showFileMenu ? 'is-open' : ''}">${icons.chevronDown(11)}</span>
          </button>
          ${showFileMenu ? `
            <div class="dropdown__overlay" id="file-overlay"></div>
            <div class="dropdown__menu dropdown__menu--narrow">
              <button class="dropdown__item" data-act="save">${spanIcon(icons.save(13))} Save</button>
              <button class="dropdown__item" data-act="open">${spanIcon(icons.folderOpen(13))} Open</button>
              <div class="dropdown__divider"></div>
              <button class="dropdown__item" data-act="new">${spanIcon(icons.filePlus(13))} New</button>
              <div class="dropdown__divider"></div>
              <button class="dropdown__item" data-act="export">${spanIcon(icons.download(13))} Export as JSON</button>
              <button class="dropdown__item" data-act="import">${spanIcon(icons.upload(13))} Import from JSON</button>
            </div>
          ` : ''}
        </div>

        <button class="toolbar-btn ${s.activePanel === 'help' ? 'toolbar-btn--active-help' : ''}" id="help-btn" title="Guide">
          ${icons.helpCircle(13)} Guide
        </button>

        <div class="toolbar__divider"></div>

        <button class="toolbar-btn toolbar-btn--icon-only" id="fit-view" title="Fit to view">${icons.maximize(13)}</button>
      </div>

      <input id="file-input" type="file" accept=".json" class="hidden" />
    </div>
  `;

  // events
  byId('add-node')?.addEventListener('click', () => openCreateNodeModal());
  byId('filters-btn')?.addEventListener('click', () => actions.setActivePanel(getState().activePanel === 'views' ? 'none' : 'views'));
  byId('help-btn')?.addEventListener('click', () => actions.setActivePanel(getState().activePanel === 'help' ? 'none' : 'help'));
  byId('fit-view')?.addEventListener('click', () => actions.triggerFitView());

  if (editingName) {
    const input = byId('name-input');
    if (input) {
      input.focus(); input.select();
      input.addEventListener('input', (e) => { nameDraft = e.target.value; });
      input.addEventListener('blur', () => { actions.setMapName(nameDraft.trim() || s.mapName); editingName = false; render(); });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { actions.setMapName(nameDraft.trim() || s.mapName); editingName = false; render(); }
        if (e.key === 'Escape') { editingName = false; render(); }
      });
    }
  } else {
    byId('name-button')?.addEventListener('click', () => {
      nameDraft = s.mapName;
      editingName = true;
      render();
    });
  }

  byId('canvas-menu-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    showCanvasMenu = !showCanvasMenu;
    showFileMenu = false;
    render();
  });
  byId('canvas-overlay')?.addEventListener('click', () => { showCanvasMenu = false; render(); });
  host.querySelectorAll('[data-size]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [w, h] = btn.dataset.size.split('x').map(Number);
      actions.setCanvasSize(w, h);
      showCanvasMenu = false; render();
    });
  });

  byId('file-menu-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    showFileMenu = !showFileMenu;
    showCanvasMenu = false;
    render();
  });
  byId('file-overlay')?.addEventListener('click', () => { showFileMenu = false; render(); });
  host.querySelectorAll('[data-act]').forEach((btn) => {
    btn.addEventListener('click', () => onFileAct(btn.dataset.act));
  });

  byId('file-input')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const data = await importFromJSON(file);
        actions.importMap({ nodes: data.nodes, edges: data.edges });
        if (data.name) actions.setMapName(data.name);
      } catch (err) {
        console.error('Import failed:', err);
      }
    }
    e.target.value = '';
  });
}

function onFileAct(act) {
  showFileMenu = false;
  const s = getState();
  if (act === 'save') {
    saveMap({
      name: s.mapName,
      canvasWidth: s.canvasWidth, canvasHeight: s.canvasHeight,
      gridLocked: s.gridLocked,
      nodes: s.nodes, edges: s.edges,
    });
    saveFlash = true;
    render();
    setTimeout(() => { saveFlash = false; render(); }, 1500);
  }
  else if (act === 'open') openSavedMapsModal();
  else if (act === 'new') {
    if (s.nodes.length > 0 && !window.confirm('Start a new map? Unsaved changes will be lost.')) {
      render(); return;
    }
    actions.newMap();
    render();
  }
  else if (act === 'export') {
    exportToJSON(s.mapName, s.nodes, s.edges);
    render();
  }
  else if (act === 'import') {
    byId('file-input')?.click();
    render();
  }
}

function byId(id) { return host.querySelector(`#${id}`); }
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
function spanIcon(svg) {
  return `<span class="icon-mute">${svg}</span>`;
}
