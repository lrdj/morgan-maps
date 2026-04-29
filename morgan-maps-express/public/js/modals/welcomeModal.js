import { actions } from '../state.js';
import { SEED_NODES, SEED_EDGES } from '../seedData.js';
import { icons } from '../icons.js';

let host;

export function mountWelcomeModalHost(hostEl) { host = hostEl; }

export function openWelcomeModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay modal-overlay--soft';
  overlay.innerHTML = `
    <div class="modal modal--welcome" id="welcome-modal">
      <div class="welcome-header">
        <div class="welcome-icon">${icons.map(22)}</div>
        <h1 class="welcome-title">Morgan Map</h1>
        <p class="welcome-sub">A decision-centred way of mapping services — plotting elements by how automatable they are and how critical they are to good outcomes and trust.</p>
      </div>
      <div class="welcome-options">
        <button class="welcome-option" id="load-example">
          <span class="welcome-option__icon">${icons.bookOpen(16)}</span>
          <div>
            <div class="welcome-option__title">Load example map</div>
            <div class="welcome-option__desc">Universal Credit Claim Journey — a worked example showing decisions, evidence, execution, and interfaces across a complex government service.</div>
          </div>
        </button>
        <button class="welcome-option welcome-option--neutral" id="start-blank">
          <span class="welcome-option__icon">${icons.plus(16)}</span>
          <div>
            <div class="welcome-option__title">Start blank</div>
            <div class="welcome-option__desc">Begin with an empty canvas. Add nodes, connect them, and build your own map from scratch.</div>
          </div>
        </button>
        <p class="welcome-foot">You can import a JSON file at any time via <span style="font-weight:500;">File → Import</span></p>
      </div>
    </div>
  `;
  host.appendChild(overlay);

  function close() { overlay.remove(); }
  overlay.querySelector('#load-example')?.addEventListener('click', () => {
    actions.importMap({ nodes: SEED_NODES, edges: SEED_EDGES });
    actions.setMapName('Universal Credit Claim Journey');
    setTimeout(() => actions.triggerFitView(), 80);
    close();
  });
  overlay.querySelector('#start-blank')?.addEventListener('click', close);
}
