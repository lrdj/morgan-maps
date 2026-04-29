import { getState, subscribe, actions } from '../state.js';
import {
  RELATIONSHIP_TYPES, RELATIONSHIP_LABELS,
  RELATIONSHIP_SHORT, RELATIONSHIP_LONG,
} from '../constants.js';
import { icons } from '../icons.js';

let host;
let overlay = null;

export function mountCreateEdgeModalHost(hostEl) {
  host = hostEl;
  subscribe(syncOpenState);
}

function syncOpenState() {
  const s = getState();
  const editId = s.activePanel === 'edge' && s.selectedEdgeId ? s.selectedEdgeId : null;
  if (editId && !overlay) openEdgeModal(editId);
  else if (!editId && overlay) closeOverlay();
}

function openEdgeModal(editEdgeId) {
  const s = getState();
  const edge = s.edges.find((e) => e.id === editEdgeId);
  if (!edge) return;
  const sourceNode = s.nodes.find((n) => n.id === edge.source);
  const targetNode = s.nodes.find((n) => n.id === edge.target);

  let form = { ...edge.data };

  overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  host.appendChild(overlay);

  function render() {
    overlay.innerHTML = `
      <div class="modal modal--edge">
        <div class="modal-header">
          <div>
            <h2 class="modal-header__title">Edit Relationship</h2>
            ${sourceNode && targetNode ? `<p style="font-size:11px;color:var(--gray-400);margin:2px 0 0;">${escapeHtml(sourceNode.data.title)} → ${escapeHtml(targetNode.data.title)}</p>` : ''}
          </div>
          <button class="icon-btn" id="close-x">${icons.x(16)}</button>
        </div>
        <div class="modal-body">
          <div>
            <label class="field-label" style="margin-bottom:6px;">Relationship Type</label>
            <div class="relationship-grid">
              ${RELATIONSHIP_TYPES.map((t) => `
                <button class="relationship-option ${form.relationshipType === t ? 'is-selected' : ''}" data-rel="${t}" title="${escapeAttr(RELATIONSHIP_LONG[t])}">
                  <div class="relationship-option__title">${RELATIONSHIP_LABELS[t]}</div>
                  <div class="relationship-option__sub">${RELATIONSHIP_SHORT[t]}</div>
                </button>
              `).join('')}
            </div>
          </div>
          <div>
            <label class="field-label">Description</label>
            <textarea class="text-area" id="f-desc" rows="2" placeholder="Describe this relationship">${escapeHtml(form.description ?? '')}</textarea>
          </div>
        </div>
        <div class="modal-footer modal-footer--split">
          <div>
            <button class="btn btn--danger" id="delete-btn">Delete</button>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button class="btn btn--ghost" id="cancel-btn">Cancel</button>
            <button class="btn btn--primary" id="submit-btn">Save Changes</button>
          </div>
        </div>
      </div>
    `;

    overlay.querySelector('#close-x').addEventListener('click', closeAndDeselect);
    overlay.querySelector('#cancel-btn').addEventListener('click', closeAndDeselect);
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) closeAndDeselect(); });

    overlay.querySelectorAll('[data-rel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        form.relationshipType = btn.dataset.rel;
        render();
      });
    });
    overlay.querySelector('#f-desc').addEventListener('input', (e) => { form.description = e.target.value; });

    overlay.querySelector('#submit-btn').addEventListener('click', () => {
      actions.updateEdge(editEdgeId, form);
      closeAndDeselect();
    });
    overlay.querySelector('#delete-btn').addEventListener('click', () => {
      actions.deleteEdge(editEdgeId);
      closeOverlay(); // store will already drop selection
    });
  }

  render();
}

function closeAndDeselect() {
  actions.setActivePanel('none');
}

function closeOverlay() {
  if (overlay) { overlay.remove(); overlay = null; }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
