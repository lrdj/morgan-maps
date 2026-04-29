import { actions } from '../state.js';
import { listSavedMaps, deleteSavedMap, formatSavedAt } from '../localSaves.js';
import { SEED_NODES, SEED_EDGES } from '../seedData.js';
import { icons } from '../icons.js';

let host;

export function mountSavedMapsHost(hostEl) { host = hostEl; }

export function openSavedMapsModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  host.appendChild(overlay);

  function close() { overlay.remove(); }

  function render() {
    const saves = listSavedMaps();
    overlay.innerHTML = `
      <div class="modal modal--saved">
        <div class="modal-header">
          <div class="panel-header__title-group">
            <span style="color:var(--indigo-500);display:inline-flex;">${icons.database(16)}</span>
            <h2 class="modal-header__title">Saved Maps</h2>
            <span class="toolbar__counts">stored in browser</span>
          </div>
          <button class="icon-btn" id="close-x">${icons.x(15)}</button>
        </div>

        <div class="modal-body">
          <div>
            <p class="saved-section-title">Examples</p>
            <div class="example-card" id="load-example">
              <span class="example-card__icon">${icons.bookOpen(14)}</span>
              <div style="flex:1;min-width:0;">
                <p class="example-card__title">Universal Credit Claim Journey</p>
                <div class="example-card__sub">
                  <p>20 nodes · 22 edges</p>
                  <span class="example-card__star">${icons.star(8)} Default example</span>
                </div>
              </div>
              <button class="example-card__open">${icons.folderOpen(11)} Open</button>
            </div>
          </div>

          <p class="saved-section-title" style="margin-top:16px;">Your saved maps</p>
          ${saves.length === 0 ? `
            <div class="saved-empty">
              <span style="color:var(--gray-300);">${icons.folderOpen(32)}</span>
              <p style="font-size:14px;font-weight:500;color:var(--gray-400);">No saved maps yet</p>
              <p style="font-size:12px;color:var(--gray-300);">Use the Save button in the toolbar to save your current map</p>
            </div>
          ` : `
            <div class="saved-list">
              ${saves.map((save) => `
                <div class="saved-card" data-id="${save.id}">
                  <div style="flex:1;min-width:0;">
                    <p class="saved-card__title">${escapeHtml(save.name)}</p>
                    <div class="saved-card__meta">
                      <span class="saved-card__time">${icons.clock(10)} ${formatSavedAt(save.savedAt)}</span>
                      <span class="saved-card__counts">${save.nodeCount} nodes · ${save.edgeCount} edges</span>
                    </div>
                  </div>
                  <div class="saved-card__actions">
                    <button class="icon-btn icon-btn--danger" data-act="delete" data-id="${save.id}" title="Delete">${icons.trash(13)}</button>
                    <button class="btn btn--indigo" data-act="open" data-id="${save.id}">${icons.folderOpen(11)} Open</button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div class="saved-foot">
          <p>Maps are saved in your browser's local storage. They'll persist across sessions but are tied to this browser. Use Export to share or back up a map as a file.</p>
        </div>
      </div>
    `;

    overlay.querySelector('#close-x').addEventListener('click', close);
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) close(); });

    overlay.querySelector('#load-example').addEventListener('click', () => {
      actions.importMap({ nodes: SEED_NODES, edges: SEED_EDGES });
      actions.setMapName('Universal Credit Claim Journey');
      setTimeout(() => actions.triggerFitView(), 80);
      close();
    });

    overlay.querySelectorAll('[data-act="open"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const save = listSavedMaps().find((s) => s.id === btn.dataset.id);
        if (!save) return;
        actions.importMap({ nodes: save.nodes, edges: save.edges });
        actions.setMapName(save.name);
        actions.setCanvasSize(save.canvasWidth ?? 1200, save.canvasHeight ?? 900);
        setTimeout(() => actions.triggerFitView(), 80);
        close();
      });
    });
    overlay.querySelectorAll('[data-act="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        deleteSavedMap(btn.dataset.id);
        render();
      });
    });
  }

  render();
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
