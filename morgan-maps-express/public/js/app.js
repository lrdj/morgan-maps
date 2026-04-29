// Entry — wires the whole app together.

import { mountToolbar } from './toolbar.js';
import { mountCanvas } from './canvas.js';
import { mountNodeDetail } from './panels/nodeDetail.js';
import { mountViewsPanel } from './panels/viewsPanel.js';
import { mountHelpPanel } from './panels/helpPanel.js';
import {
  mountWelcomeModalHost, openWelcomeModal,
} from './modals/welcomeModal.js';
import { mountCreateNodeModalHost } from './modals/createNodeModal.js';
import { mountCreateEdgeModalHost } from './modals/createEdgeModal.js';
import { mountSavedMapsHost } from './modals/savedMapsModal.js';
import { subscribe, getState } from './state.js';

function start() {
  const toolbarHost = document.getElementById('toolbar');
  const canvasHost = document.getElementById('canvas-host');
  const rightPanelHost = document.getElementById('right-panel');
  const modalHost = document.getElementById('modal-host');

  // Right-panel routing — we mount each panel against the same host;
  // the panels themselves only render when their activePanel matches.
  // To avoid clashes, each panel clears the host on its own render path.
  const panelRouter = createPanelRouter(rightPanelHost);
  mountToolbar(toolbarHost);
  mountCanvas(canvasHost);
  mountNodeDetail(panelRouter.host);
  mountViewsPanel(panelRouter.host);
  mountHelpPanel(panelRouter.host);

  // Modal hosts share the same DOM host; each modal manages its own overlay.
  mountWelcomeModalHost(modalHost);
  mountCreateNodeModalHost(modalHost);
  mountCreateEdgeModalHost(modalHost);
  mountSavedMapsHost(modalHost);

  openWelcomeModal();
}

// The right panel is a single host shared by three panels. Each panel checks
// state.activePanel and renders only when matched, so the panels coexist.
function createPanelRouter(rightPanelHost) {
  // Single shared mount point — panels each clear and rewrite on demand.
  return { host: rightPanelHost };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
