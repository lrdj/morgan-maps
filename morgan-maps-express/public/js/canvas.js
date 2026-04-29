// Canvas — replaces ReactFlow with hand-rolled DOM + SVG.
//   • Pan / zoom via CSS transform on a viewport <div>
//   • Nodes are absolutely-positioned <div>s inside that viewport
//   • Edges + axis background live in SVG layers also inside the viewport
//   • Interaction: drag node, pan empty space, wheel-zoom around mouse,
//     selection-mode (left-drag = box select), double-click to add node
//   • All state changes go through the shared store; we re-render from state

import { getState, subscribe, actions } from './state.js';
import { canvasToAxis, axisToCanvas, NODE_WIDTH, NODE_HEIGHT } from './coordinates.js';
import {
  NODE_TYPE_COLOURS, NODE_TYPE_LABELS,
  EDGE_STYLES, EDGE_SHORT_LABELS,
  X_BAND_LABELS, Y_BAND_LABELS,
} from './constants.js';
import { computeStepNumbers } from './stepNumbers.js';

const NODE_W = NODE_WIDTH;
const NODE_H = NODE_HEIGHT;

// Viewport (pan + zoom) is canvas-local — not in shared state — so panning
// doesn't churn re-renders in the toolbar or panels.
const viewport = { x: 0, y: 0, zoom: 1 };

let host;                        // outer host element
let root;                        // .canvas-root (interactive area)
let viewportEl;                  // .canvas-viewport (transformed)
let edgesSvg;                    // <svg> for edges (inside viewport)
let edgeLabelsLayer;             // <div> for HTML edge labels (inside viewport)
let nodesLayer;                  // <div> container for nodes (inside viewport)
let axisSvg;                     // <svg> for axis background
let controlsEl;                  // .canvas-controls
let minimapEl = null;            // optional minimap
let selectionMode = false;       // box-select mode
let minimapVisible = false;
let lastFitTrigger = 0;
let cleanupGlobalListeners = null;

let prevCanvasW = 0, prevCanvasH = 0;
let prevSelectedNodeId = null;
let prevSelectedEdgeId = null;

const NODE_SHAPES = {
  decision: () =>
    '<svg width="14" height="14" viewBox="0 0 14 14" fill="none">' +
    '<rect x="7" y="1" width="8" height="8" transform="rotate(45 7 7)" fill="#f59e0b" rx="1"/></svg>',
  evidence: () =>
    '<svg width="12" height="12" viewBox="0 0 12 12" fill="none">' +
    '<polygon points="6,1 10.5,3.5 10.5,8.5 6,11 1.5,8.5 1.5,3.5" fill="#14b8a6"/></svg>',
  execution: () =>
    '<svg width="12" height="12" viewBox="0 0 12 12" fill="none">' +
    '<rect x="1.5" y="1.5" width="9" height="9" rx="2" fill="#7c3aed"/></svg>',
  interface: () =>
    '<svg width="12" height="12" viewBox="0 0 12 12" fill="none">' +
    '<circle cx="6" cy="6" r="4.5" fill="#3b82f6"/></svg>',
};

// ─── Mount ─────────────────────────────────────────────────────────────────

export function mountCanvas(hostEl) {
  host = hostEl;
  host.innerHTML = '';
  host.classList.add('canvas-host-mount');

  root = document.createElement('div');
  root.className = 'canvas-root';

  viewportEl = document.createElement('div');
  viewportEl.className = 'canvas-viewport';

  // Axis background SVG (lowest layer in the viewport)
  axisSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  axisSvg.classList.add('axis-bg');
  axisSvg.setAttribute('overflow', 'visible');

  // Edges SVG sits above axis, below nodes
  edgesSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  edgesSvg.classList.add('canvas-edges');
  edgesSvg.setAttribute('overflow', 'visible');

  // Define a shared arrowhead marker
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const baseMarker = makeArrowMarker('arrow-default', '#94a3b8');
  defs.appendChild(baseMarker);
  edgesSvg.appendChild(defs);

  edgeLabelsLayer = document.createElement('div');
  edgeLabelsLayer.className = 'edge-labels-layer';

  nodesLayer = document.createElement('div');
  nodesLayer.className = 'canvas-nodes-layer';
  nodesLayer.style.position = 'absolute';
  nodesLayer.style.top = '0'; nodesLayer.style.left = '0';

  viewportEl.appendChild(axisSvg);
  viewportEl.appendChild(edgesSvg);
  viewportEl.appendChild(nodesLayer);
  viewportEl.appendChild(edgeLabelsLayer);
  root.appendChild(viewportEl);
  host.appendChild(root);

  // Controls
  controlsEl = document.createElement('div');
  controlsEl.className = 'canvas-controls';
  controlsEl.innerHTML = `
    <button data-act="zoom-in" title="Zoom in">${zoomInIcon()}</button>
    <button data-act="zoom-out" title="Zoom out">${zoomOutIcon()}</button>
    <button data-act="select-mode" title="Box select mode">${selectIcon()}</button>
    <button data-act="lock-nodes" title="Lock nodes">${lockOpenIcon()}</button>
    <button data-act="minimap" title="Show overview map">${minimapIcon()}</button>
  `;
  root.appendChild(controlsEl);

  controlsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'zoom-in')      zoomBy(1.2);
    else if (act === 'zoom-out') zoomBy(1 / 1.2);
    else if (act === 'select-mode') {
      selectionMode = !selectionMode;
      root.classList.toggle('is-select-mode', selectionMode);
      btn.classList.toggle('is-active-blue', selectionMode);
    }
    else if (act === 'lock-nodes') {
      actions.toggleNodesLocked();
    }
    else if (act === 'minimap') {
      minimapVisible = !minimapVisible;
      btn.classList.toggle('is-active-indigo', minimapVisible);
      renderMinimap();
    }
  });

  attachInteractions();
  subscribe(handleStateChange);

  const s = getState();
  prevCanvasW = s.canvasWidth;
  prevCanvasH = s.canvasHeight;
  fullRender();
  // Initial fit-bounds (mirrors ReactFlow's onInit fitBounds)
  setTimeout(() => fitBounds(), 0);
}

// ─── Render pipeline ───────────────────────────────────────────────────────

function handleStateChange(state, changedKeys) {
  const keys = new Set(changedKeys);

  // canvas size changed → re-render axis + adjust fit (animated)
  if (state.canvasWidth !== prevCanvasW || state.canvasHeight !== prevCanvasH) {
    prevCanvasW = state.canvasWidth;
    prevCanvasH = state.canvasHeight;
    renderAxis();
    fitBounds(true);
  }

  // Fit-view trigger
  if (state.fitViewTrigger > lastFitTrigger) {
    lastFitTrigger = state.fitViewTrigger;
    fitView();
  }

  // Always render nodes/edges on any state change — cheap with these sizes.
  renderEdges();
  renderNodes();
  updateLockButton();
  renderMinimap();

  // Track selection changes for re-render edge/edges styling.
  prevSelectedNodeId = state.selectedNodeId;
  prevSelectedEdgeId = state.selectedEdgeId;
}

function fullRender() {
  applyViewport();
  renderAxis();
  renderEdges();
  renderNodes();
  updateLockButton();
  renderMinimap();
}

function applyViewport() {
  if (!viewportEl) return;
  viewportEl.style.transform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`;
  // Make the dotted background pan along with the viewport so it feels
  // attached to the world (matches ReactFlow's Dots background). Don't
  // scale the dot gap — keeps the dot density stable on zoom.
  if (root) {
    const gap = 24;
    const ox = ((viewport.x % gap) + gap) % gap;
    const oy = ((viewport.y % gap) + gap) % gap;
    root.style.backgroundPosition = `${ox}px ${oy}px`;
  }
}

// ─── Axis background ───────────────────────────────────────────────────────

function renderAxis() {
  const { canvasWidth: w, canvasHeight: h } = getState();
  axisSvg.setAttribute('width', String(w));
  axisSvg.setAttribute('height', String(h));
  axisSvg.style.width = `${w}px`;
  axisSvg.style.height = `${h}px`;
  axisSvg.innerHTML = '';

  const xDiv = w / 5, yDiv = h / 5;
  const NS = 'http://www.w3.org/2000/svg';

  for (let i = 1; i < 5; i++) {
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', i * xDiv); line.setAttribute('y1', 0);
    line.setAttribute('x2', i * xDiv); line.setAttribute('y2', h);
    line.setAttribute('stroke', 'rgba(0,0,0,0.07)');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('stroke-dasharray', '5 5');
    axisSvg.appendChild(line);
  }
  for (let i = 1; i < 5; i++) {
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', 0);   line.setAttribute('y1', i * yDiv);
    line.setAttribute('x2', w);   line.setAttribute('y2', i * yDiv);
    line.setAttribute('stroke', 'rgba(0,0,0,0.07)');
    line.setAttribute('stroke-width', '1');
    line.setAttribute('stroke-dasharray', '5 5');
    axisSvg.appendChild(line);
  }

  const rect = document.createElementNS(NS, 'rect');
  rect.setAttribute('x', 0); rect.setAttribute('y', 0);
  rect.setAttribute('width', w); rect.setAttribute('height', h);
  rect.setAttribute('fill', 'none');
  rect.setAttribute('stroke', 'rgba(0,0,0,0.12)');
  rect.setAttribute('stroke-width', '1');
  axisSvg.appendChild(rect);

  // X band labels
  X_BAND_LABELS.forEach((label, i) => {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', i * xDiv + xDiv / 2);
    t.setAttribute('y', h - 10);
    t.setAttribute('fill', 'rgba(0,0,0,0.15)');
    t.setAttribute('font-size', '8.5');
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('font-family', 'system-ui, sans-serif');
    t.setAttribute('font-weight', '500');
    t.textContent = label.toUpperCase();
    axisSvg.appendChild(t);
  });

  const xTitle = document.createElementNS(NS, 'text');
  xTitle.setAttribute('x', w / 2);
  xTitle.setAttribute('y', h + 18);
  xTitle.setAttribute('fill', 'rgba(0,0,0,0.3)');
  xTitle.setAttribute('font-size', '10');
  xTitle.setAttribute('font-weight', '700');
  xTitle.setAttribute('text-anchor', 'middle');
  xTitle.setAttribute('font-family', 'system-ui, sans-serif');
  xTitle.setAttribute('letter-spacing', '0.08em');
  xTitle.textContent = 'AUTOMATION';
  const xTip = document.createElementNS(NS, 'title');
  xTip.textContent = 'How far an element can be handled by software or machines rather than human effort.';
  xTitle.appendChild(xTip);
  axisSvg.appendChild(xTitle);

  // Y title (rotated)
  const yTitle = document.createElementNS(NS, 'text');
  yTitle.setAttribute('x', -h / 2);
  yTitle.setAttribute('y', -18);
  yTitle.setAttribute('fill', 'rgba(0,0,0,0.3)');
  yTitle.setAttribute('font-size', '10');
  yTitle.setAttribute('font-weight', '700');
  yTitle.setAttribute('text-anchor', 'middle');
  yTitle.setAttribute('font-family', 'system-ui, sans-serif');
  yTitle.setAttribute('letter-spacing', '0.08em');
  yTitle.setAttribute('transform', 'rotate(-90)');
  yTitle.textContent = 'CRITICALITY';
  const yTip = document.createElementNS(NS, 'title');
  yTip.textContent = 'How much an element matters to getting the decision right and sustaining trust in the outcome.';
  yTitle.appendChild(yTip);
  axisSvg.appendChild(yTitle);

  // Y band labels (rotated -90 about midpoint)
  Y_BAND_LABELS.forEach((label, i) => {
    const cx = 20, cy = i * yDiv + yDiv / 2;
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', cx);
    t.setAttribute('y', cy);
    t.setAttribute('fill', 'rgba(0,0,0,0.15)');
    t.setAttribute('font-size', '8.5');
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'central');
    t.setAttribute('font-family', 'system-ui, sans-serif');
    t.setAttribute('font-weight', '500');
    t.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);
    t.textContent = label.toUpperCase();
    axisSvg.appendChild(t);
  });
}

// ─── Nodes ─────────────────────────────────────────────────────────────────

function renderNodes() {
  const state = getState();
  const visibility = computeVisibility(state);
  const stepNumbers = computeStepNumbers(state.nodes, state.edges);
  const ancestorSet = new Set(state.traceAncestors);
  const descendantSet = new Set(state.traceDescendants);
  const overlays = state.overlays;

  // Diff existing DOM nodes against state.
  const existing = new Map();
  for (const el of nodesLayer.children) existing.set(el.dataset.id, el);

  for (const node of state.nodes) {
    let el = existing.get(node.id);
    if (!el) {
      el = document.createElement('div');
      el.className = 'node';
      el.dataset.id = node.id;
      el.addEventListener('mousedown', onNodeMouseDown);
      el.addEventListener('click', onNodeClick);
      nodesLayer.appendChild(el);
    } else {
      existing.delete(node.id);
    }

    const d = node.data;
    const colour = NODE_TYPE_COLOURS[d.nodeType] ?? '#94a3b8';
    const stepLabel = state.showStepNumbers ? stepNumbers[node.id] : undefined;
    const showFriction = !!(overlays.frictionPoints && d.overlays?.frictionPoints);
    const showDataQuality = !!(overlays.dataQuality && d.overlays?.dataQuality);
    const showOrgBoundaries = !!(overlays.orgBoundaries && d.overlays?.orgBoundaries);
    const showPathway = !!(overlays.pathway && d.overlays?.pathway);
    const showPolicy = !!(overlays.policyConstraints && d.overlays?.policyConstraints);

    el.style.left = `${node.position.x}px`;
    el.style.top = `${node.position.y}px`;
    el.style.borderColor = colour;
    if (d.status === 'planned') {
      el.style.borderStyle = 'dashed';
    } else {
      el.style.borderStyle = 'solid';
    }

    el.classList.toggle('is-selected', !!d.selected);
    el.classList.toggle('is-planned', d.status === 'planned');
    el.classList.toggle('is-deprecated', d.status === 'deprecated');

    const v = visibility[node.id] ?? { visible: true, faded: false };
    el.classList.toggle('is-faded', v.faded);
    el.classList.toggle('is-trace-ancestor', ancestorSet.has(node.id));
    el.classList.toggle('is-trace-descendant', descendantSet.has(node.id));
    el.classList.toggle('has-overlay-org-boundaries', showOrgBoundaries);
    el.classList.toggle('has-overlay-pathway', showPathway);
    el.classList.toggle('has-overlay-data-quality', showDataQuality);
    el.classList.toggle('has-overlay-policy-constraints', showPolicy);

    el.innerHTML = `
      <div class="node__top">
        <div class="node__type-badge" style="background:${colour}22">
          <span class="node__type-icon">${NODE_SHAPES[d.nodeType] ? NODE_SHAPES[d.nodeType]() : ''}</span>
          <span class="node__type-label" style="color:${colour}">${NODE_TYPE_LABELS[d.nodeType] ?? ''}</span>
        </div>
        ${stepLabel ? `<span class="node__step-badge ${stepLabel.length > 2 ? 'is-long' : ''}" title="Step ${escapeHtml(stepLabel)}">${escapeHtml(stepLabel)}</span>` : ''}
      </div>
      <p class="node__title">${escapeHtml(d.title || '')}</p>
      <p class="node__org">${escapeHtml(d.organisation || '')}</p>
      ${showFriction ? '<span class="node__friction-dot" title="Friction point"></span>' : ''}
    `;
  }

  // remove leftover nodes
  for (const [, el] of existing) el.remove();
}

function computeVisibility(state) {
  const { nodes, filters, selectedNodeId, traceAncestors, traceDescendants } = state;
  const tracingActive = !!selectedNodeId;
  const ancestorSet = new Set(traceAncestors);
  const descendantSet = new Set(traceDescendants);
  const out = {};
  for (const node of nodes) {
    const d = node.data;
    let visible = true;
    if (filters.nodeTypes.length > 0 && !filters.nodeTypes.includes(d.nodeType)) visible = false;
    if (filters.organisations.length > 0 && !filters.organisations.includes(d.organisation)) visible = false;
    if (filters.tags.length > 0 && !filters.tags.some((t) => d.tags.includes(t))) visible = false;
    if (d.criticalityLevel < filters.criticalityRange[0] || d.criticalityLevel > filters.criticalityRange[1]) visible = false;
    if (d.automationLevel < filters.automationRange[0] || d.automationLevel > filters.automationRange[1]) visible = false;
    const isSelected = node.id === selectedNodeId;
    const isOnPath = isSelected || ancestorSet.has(node.id) || descendantSet.has(node.id);
    const traceFade = tracingActive && !isOnPath;
    out[node.id] = { visible, faded: !visible || traceFade };
  }
  return out;
}

// ─── Edges ─────────────────────────────────────────────────────────────────

function getBorderAttachment(nodeX, nodeY, nodeW, nodeH, otherCenter) {
  const cx = nodeX + nodeW / 2;
  const cy = nodeY + nodeH / 2;
  const dx = otherCenter.x - cx;
  const dy = otherCenter.y - cy;
  const hw = nodeW / 2, hh = nodeH / 2;
  if (dx === 0 && dy === 0) return { x: cx, y: nodeY + nodeH };
  const tx = dx !== 0 ? Math.abs(hw / dx) : Infinity;
  const ty = dy !== 0 ? Math.abs(hh / dy) : Infinity;
  if (tx <= ty) {
    if (dx > 0) return { x: cx + hw, y: cy + dy * tx };
    return { x: cx - hw, y: cy + dy * tx };
  }
  if (dy > 0) return { x: cx + dx * ty, y: cy + hh };
  return { x: cx + dx * ty, y: cy - hh };
}

function bezierPath(sx, sy, tx, ty) {
  // Simple horizontal-bias bezier (matches ReactFlow getBezierPath result roughly).
  const dx = Math.abs(tx - sx);
  const dy = Math.abs(ty - sy);
  // Detect orientation by which axis dominates the source/target spread.
  const horizontalBias = dx > dy;
  let c1x, c1y, c2x, c2y;
  if (horizontalBias) {
    const cx = sx + (tx - sx) / 2;
    c1x = cx; c1y = sy;
    c2x = cx; c2y = ty;
  } else {
    const cy = sy + (ty - sy) / 2;
    c1x = sx; c1y = cy;
    c2x = tx; c2y = cy;
  }
  // Mid-point on cubic for label placement
  const labelX = 0.125 * sx + 0.375 * c1x + 0.375 * c2x + 0.125 * tx;
  const labelY = 0.125 * sy + 0.375 * c1y + 0.375 * c2y + 0.125 * ty;
  const path = `M${sx},${sy} C${c1x},${c1y} ${c2x},${c2y} ${tx},${ty}`;
  return { path, labelX, labelY };
}

function renderEdges() {
  const state = getState();
  const { edges, nodes, selectedNodeId, selectedEdgeId, traceAncestors, traceDescendants } = state;
  const visibility = computeVisibility(state);

  // Re-build defs (one arrow marker per relationship colour, recreated every render)
  const NS = 'http://www.w3.org/2000/svg';
  const w = state.canvasWidth, h = state.canvasHeight;
  edgesSvg.setAttribute('width', String(w + 200));
  edgesSvg.setAttribute('height', String(h + 200));
  edgesSvg.style.width = `${w + 200}px`;
  edgesSvg.style.height = `${h + 200}px`;

  edgesSvg.innerHTML = '';
  edgeLabelsLayer.innerHTML = '';

  const defs = document.createElementNS(NS, 'defs');
  for (const rel of Object.keys(EDGE_STYLES)) {
    defs.appendChild(makeArrowMarker(`arrow-${rel}`, EDGE_STYLES[rel].stroke));
  }
  edgesSvg.appendChild(defs);

  const tracingActive = !!selectedNodeId;
  const pathNodeIds = new Set([selectedNodeId, ...traceAncestors, ...traceDescendants]);

  for (const edge of edges) {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    if (!sourceNode || !targetNode) continue;

    const sw = NODE_W, sh = NODE_H, tw = NODE_W, th = NODE_H;
    const sourceCenter = {
      x: sourceNode.position.x + sw / 2,
      y: sourceNode.position.y + sh / 2,
    };
    const targetCenter = {
      x: targetNode.position.x + tw / 2,
      y: targetNode.position.y + th / 2,
    };
    const src = getBorderAttachment(sourceNode.position.x, sourceNode.position.y, sw, sh, targetCenter);
    const tgt = getBorderAttachment(targetNode.position.x, targetNode.position.y, tw, th, sourceCenter);

    const { path: dPath, labelX, labelY } = bezierPath(src.x, src.y, tgt.x, tgt.y);

    const rel = edge.data?.relationshipType ?? 'informs';
    const style = EDGE_STYLES[rel] ?? EDGE_STYLES.informs;
    const isSelected = selectedEdgeId === edge.id;

    const sourceVis = visibility[edge.source]?.visible !== false;
    const targetVis = visibility[edge.target]?.visible !== false;
    const isOnPath = !tracingActive || (pathNodeIds.has(edge.source) && pathNodeIds.has(edge.target));
    const opacity = (!sourceVis || !targetVis) ? 0.15 : (tracingActive && !isOnPath) ? 0.08 : 1;

    // visible path
    const visPath = document.createElementNS(NS, 'path');
    visPath.classList.add('edge-path');
    visPath.setAttribute('d', dPath);
    visPath.setAttribute('fill', 'none');
    visPath.setAttribute('stroke', style.stroke);
    visPath.setAttribute('stroke-width', String(isSelected ? style.strokeWidth + 1 : style.strokeWidth));
    if (style.strokeDasharray) visPath.setAttribute('stroke-dasharray', style.strokeDasharray);
    visPath.setAttribute('marker-end', `url(#arrow-${rel})`);
    visPath.setAttribute('opacity', String(opacity));
    edgesSvg.appendChild(visPath);

    // hit path (transparent, fat)
    const hitPath = document.createElementNS(NS, 'path');
    hitPath.classList.add('edge-hit');
    hitPath.setAttribute('d', dPath);
    hitPath.setAttribute('fill', 'none');
    hitPath.setAttribute('stroke', 'transparent');
    hitPath.setAttribute('stroke-width', '12');
    hitPath.dataset.id = edge.id;
    hitPath.addEventListener('click', (e) => {
      e.stopPropagation();
      actions.selectEdge(edge.id);
    });
    edgesSvg.appendChild(hitPath);

    // Label
    const label = document.createElement('span');
    label.className = 'edge-label';
    label.textContent = EDGE_SHORT_LABELS[rel] ?? rel;
    label.style.backgroundColor = `${style.stroke}18`;
    label.style.color = style.stroke;
    label.style.border = `1px solid ${style.stroke}40`;
    label.style.left = `${labelX}px`;
    label.style.top = `${labelY}px`;
    label.style.opacity = String(opacity);
    label.addEventListener('click', (e) => {
      e.stopPropagation();
      actions.selectEdge(edge.id);
    });
    edgeLabelsLayer.appendChild(label);
  }
}

function makeArrowMarker(id, colour) {
  const NS = 'http://www.w3.org/2000/svg';
  const m = document.createElementNS(NS, 'marker');
  m.setAttribute('id', id);
  m.setAttribute('viewBox', '0 0 10 10');
  m.setAttribute('refX', '9');
  m.setAttribute('refY', '5');
  m.setAttribute('markerWidth', '6');
  m.setAttribute('markerHeight', '6');
  m.setAttribute('orient', 'auto-start-reverse');
  const p = document.createElementNS(NS, 'path');
  p.setAttribute('d', 'M0,0 L10,5 L0,10 z');
  p.setAttribute('fill', colour);
  m.appendChild(p);
  return m;
}

// ─── Interactions ──────────────────────────────────────────────────────────

let drag = null;       // { nodeId, startX, startY, originX, originY }
let pan = null;        // { startX, startY, originX, originY }

function attachInteractions() {
  root.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.node')) return;          // node has its own handler
    if (e.target.closest('.canvas-controls')) return;
    if (e.target.closest('.edge-label')) return;
    if (e.target.closest('.edge-hit')) return;
    if (e.target.closest('.minimap')) return;
    // Pan start
    pan = { startX: e.clientX, startY: e.clientY, originX: viewport.x, originY: viewport.y };
    e.preventDefault();
    root.classList.add('is-panning');
  });

  window.addEventListener('mousemove', onWindowMouseMove);
  window.addEventListener('mouseup', onWindowMouseUp);

  root.addEventListener('wheel', onWheel, { passive: false });

  root.addEventListener('click', (e) => {
    if (e.target === root || e.target === viewportEl || e.target === axisSvg || e.target.tagName === 'rect' || e.target.tagName === 'line') {
      // Pane click → deselect everything
      actions.setActivePanel('none');
    }
  });

  root.addEventListener('dblclick', (e) => {
    if (getState().nodesLocked) return;
    // Only if click landed on the empty pane / axis layer
    if (e.target.closest('.node') || e.target.closest('.canvas-controls') ||
        e.target.closest('.edge-label')) return;
    const flowPos = screenToFlow(e.clientX, e.clientY);
    const { canvasWidth, canvasHeight } = getState();
    const { automation, criticality } = canvasToAxis(flowPos.x, flowPos.y, canvasWidth, canvasHeight);
    actions.addNode({
      title: 'New Node', description: '', nodeType: 'execution',
      owner: '', organisation: '', tags: [], status: 'active',
      confidenceScore: 0.7, notes: '',
      automationLevel: automation, criticalityLevel: criticality,
      overlays: {}, stepOverride: null,
    });
  });

  cleanupGlobalListeners = () => {
    window.removeEventListener('mousemove', onWindowMouseMove);
    window.removeEventListener('mouseup', onWindowMouseUp);
  };
}

function onNodeMouseDown(e) {
  if (getState().nodesLocked) return;
  if (e.button !== 0) return;
  e.stopPropagation();
  const id = e.currentTarget.dataset.id;
  const node = getState().nodes.find((n) => n.id === id);
  if (!node) return;
  drag = {
    nodeId: id,
    startX: e.clientX, startY: e.clientY,
    originX: node.position.x, originY: node.position.y,
    moved: false,
  };
  e.currentTarget.classList.add('is-dragging');
}

function onNodeClick(e) {
  // suppress click after a drag-move
  if (drag && drag.moved) return;
  e.stopPropagation();
  const id = e.currentTarget.dataset.id;
  actions.selectNode(id);
}

function onWindowMouseMove(e) {
  if (drag) {
    const z = viewport.zoom;
    const dx = (e.clientX - drag.startX) / z;
    const dy = (e.clientY - drag.startY) / z;
    if (!drag.moved && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) drag.moved = true;
    if (!drag.moved) return;
    const newX = drag.originX + dx;
    const newY = drag.originY + dy;
    actions.updateNodePosition(drag.nodeId, newX, newY);
  } else if (pan) {
    const dx = e.clientX - pan.startX;
    const dy = e.clientY - pan.startY;
    setViewport({ ...viewport, x: pan.originX + dx, y: pan.originY + dy });
  }
}

function onWindowMouseUp() {
  if (drag) {
    const el = nodesLayer.querySelector(`.node[data-id="${cssEscape(drag.nodeId)}"]`);
    if (el) el.classList.remove('is-dragging');
    drag = null;
  }
  if (pan) {
    pan = null;
    root.classList.remove('is-panning');
  }
}

function onWheel(e) {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
  zoomAt(e.clientX, e.clientY, factor);
}

function zoomBy(factor) {
  const rect = root.getBoundingClientRect();
  zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
}

function zoomAt(clientX, clientY, factor) {
  const vp = viewport;
  const newZoom = clamp(vp.zoom * factor, 0.05, 2);
  if (newZoom === vp.zoom) return;
  const rect = root.getBoundingClientRect();
  const px = clientX - rect.left, py = clientY - rect.top;
  // worldX = (px - vp.x) / vp.zoom; we want worldX_new === worldX_old
  const newX = px - ((px - viewport.x) / viewport.zoom) * newZoom;
  const newY = py - ((py - viewport.y) / viewport.zoom) * newZoom;
  setViewport({ x: newX, y: newY, zoom: newZoom });
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function screenToFlow(clientX, clientY) {
  const rect = root.getBoundingClientRect();
  const vp = viewport;
  const px = clientX - rect.left, py = clientY - rect.top;
  return { x: (px - vp.x) / vp.zoom, y: (py - vp.y) / vp.zoom };
}

// ─── Fit-bounds / fit-view ─────────────────────────────────────────────────

function fitBounds(animated = false) {
  const { canvasWidth: w, canvasHeight: h } = getState();
  fitToRect(-80, -35, w + 160, h + 70, 0.04, animated);
}

function fitView() {
  // Bound the node set
  const nodes = getState().nodes;
  if (!nodes.length) { fitBounds(true); return; }
  let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;
  for (const n of nodes) {
    xMin = Math.min(xMin, n.position.x);
    yMin = Math.min(yMin, n.position.y);
    xMax = Math.max(xMax, n.position.x + NODE_W);
    yMax = Math.max(yMax, n.position.y + NODE_H);
  }
  fitToRect(xMin, yMin, xMax - xMin, yMax - yMin, 0.12, true);
}

function fitToRect(x, y, w, h, padding, animated) {
  const r = root.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) {
    requestAnimationFrame(() => fitToRect(x, y, w, h, padding, animated));
    return;
  }
  const padX = padding * w;
  const padY = padding * h;
  const zoom = Math.min(
    r.width / (w + padX * 2),
    r.height / (h + padY * 2),
    2,
  );
  const newZoom = Math.max(zoom, 0.05);
  const targetX = (r.width - (w + padX * 2) * newZoom) / 2 - (x - padX) * newZoom;
  const targetY = (r.height - (h + padY * 2) * newZoom) / 2 - (y - padY) * newZoom;
  if (animated) {
    animateViewport({ x: targetX, y: targetY, zoom: newZoom }, 400);
  } else {
    setViewport({ x: targetX, y: targetY, zoom: newZoom });
  }
}

function animateViewport(target, duration) {
  const start = { ...viewport };
  const t0 = performance.now();
  function step(now) {
    const t = Math.min(1, (now - t0) / duration);
    const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
    actions.setViewport({
      x: start.x + (target.x - start.x) * e,
      y: start.y + (target.y - start.y) * e,
      zoom: start.zoom + (target.zoom - start.zoom) * e,
    });
    applyViewport();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ─── Lock + minimap ────────────────────────────────────────────────────────

function updateLockButton() {
  const btn = controlsEl.querySelector('button[data-act="lock-nodes"]');
  if (!btn) return;
  const locked = getState().nodesLocked;
  btn.classList.toggle('is-active-red', locked);
  btn.title = locked ? 'Unlock — allow editing' : 'Lock — prevent moving or connecting nodes';
  btn.innerHTML = locked ? lockClosedIcon() : lockOpenIcon();
  root.style.cursor = ''; // reset
}

function renderMinimap() {
  if (!minimapVisible) {
    if (minimapEl) { minimapEl.remove(); minimapEl = null; }
    return;
  }
  if (!minimapEl) {
    minimapEl = document.createElement('div');
    minimapEl.className = 'minimap';
    root.appendChild(minimapEl);
  }
  const { nodes, canvasWidth: cw, canvasHeight: ch } = getState();
  const NS = 'http://www.w3.org/2000/svg';
  minimapEl.innerHTML = '';
  const svgEl = document.createElementNS(NS, 'svg');
  svgEl.setAttribute('viewBox', `0 0 ${cw} ${ch}`);
  svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  for (const n of nodes) {
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', n.position.x);
    r.setAttribute('y', n.position.y);
    r.setAttribute('width', NODE_W);
    r.setAttribute('height', NODE_H);
    r.setAttribute('fill', NODE_TYPE_COLOURS[n.data.nodeType] ?? '#94a3b8');
    r.setAttribute('opacity', '0.85');
    svgEl.appendChild(r);
  }
  minimapEl.appendChild(svgEl);
}

// ─── Inline icons (for the canvas controls) ────────────────────────────────

function zoomInIcon() {
  return '<svg viewBox="0 0 15 15" width="12" height="12" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.4"/><path d="M9.8 9.8l3.2 3.2M4.5 6.5h4M6.5 4.5v4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
}
function zoomOutIcon() {
  return '<svg viewBox="0 0 15 15" width="12" height="12" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.4"/><path d="M9.8 9.8l3.2 3.2M4.5 6.5h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
}
function selectIcon() {
  return '<svg viewBox="0 0 15 15" fill="none" width="12" height="12"><rect x="1" y="1" width="13" height="13" rx="1" stroke="currentColor" stroke-width="1.2" stroke-dasharray="3 2"/></svg>';
}
function lockOpenIcon() {
  return '<svg viewBox="0 0 15 15" fill="none" width="12" height="12"><rect x="2.5" y="6.5" width="10" height="8" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M5 6.5V4.5a2.5 2.5 0 015 0" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="7.5" cy="10.5" r="1" fill="currentColor"/></svg>';
}
function lockClosedIcon() {
  return '<svg viewBox="0 0 15 15" fill="none" width="12" height="12"><rect x="2.5" y="6.5" width="10" height="8" rx="1" stroke="currentColor" stroke-width="1.2"/><path d="M5 6.5V4.5a2.5 2.5 0 015 0v2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="7.5" cy="10.5" r="1" fill="currentColor"/></svg>';
}
function minimapIcon() {
  return '<svg viewBox="0 0 15 15" fill="none" width="12" height="12"><path d="M1 1h4v4H1V1zm0 9h4v4H1v-4zm9-9h4v4h-4V1zm0 9h4v4h-4v-4zM5.5 3.5h4M3.5 5.5v4M8.5 5.5v4M5.5 8.5h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function cssEscape(s) {
  if (window.CSS && CSS.escape) return CSS.escape(s);
  return String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}
