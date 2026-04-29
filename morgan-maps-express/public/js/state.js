// Single source of truth — mirrors the original Zustand store shape.
// Components subscribe; actions mutate via setState() and notify subscribers.

import { axisToCanvas, canvasToAxis, NODE_WIDTH, NODE_HEIGHT } from './coordinates.js';

const DEFAULT_FILTERS = {
  nodeTypes: [],
  organisations: [],
  tags: [],
  criticalityRange: [0, 1],
  automationRange: [0, 1],
};

const DEFAULT_OVERLAYS = {
  orgBoundaries: false,
  pathway: false,
  frictionPoints: false,
  policyConstraints: false,
  dataQuality: false,
};

let nodeIdCounter = 100;

const state = {
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  traceAncestors: [],
  traceDescendants: [],
  activePanel: 'none', // 'none' | 'node' | 'edge' | 'views' | 'help'
  overlays: { ...DEFAULT_OVERLAYS },
  filters: { ...DEFAULT_FILTERS },
  mapName: 'Untitled Map',
  fitViewTrigger: 0,
  gridLocked: true,
  nodesLocked: false,
  canvasWidth: 1200,
  canvasHeight: 900,
  showStepNumbers: true,
};

const listeners = new Set();

export function getState() { return state; }

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(changedKeys) {
  for (const fn of listeners) fn(state, changedKeys);
}

export function setState(patch) {
  const updates = typeof patch === 'function' ? patch(state) : patch;
  if (!updates) return;
  Object.assign(state, updates);
  notify(Object.keys(updates));
}

// ─── Graph traversal helpers ───────────────────────────────────────────────

function computeAncestors(id, edges) {
  const visited = new Set();
  const queue = [id];
  while (queue.length) {
    const current = queue.shift();
    for (const e of edges) {
      if (e.target === current && !visited.has(e.source)) {
        visited.add(e.source);
        queue.push(e.source);
      }
    }
  }
  return [...visited];
}

function computeDescendants(id, edges) {
  const visited = new Set();
  const queue = [id];
  while (queue.length) {
    const current = queue.shift();
    for (const e of edges) {
      if (e.source === current && !visited.has(e.target)) {
        visited.add(e.target);
        queue.push(e.target);
      }
    }
  }
  return [...visited];
}

// ─── Actions ───────────────────────────────────────────────────────────────

export const actions = {
  setNodes(nodes) { setState({ nodes }); },
  setEdges(edges) { setState({ edges }); },

  addNode(data) {
    const id = `node_${++nodeIdCounter}`;
    const position = axisToCanvas(data.automationLevel, data.criticalityLevel, state.canvasWidth, state.canvasHeight);
    const newNode = {
      id,
      type: data.nodeType,
      position,
      data: { ...data, selected: false },
      draggable: true,
    };
    setState({ nodes: [...state.nodes, newNode] });
    return id;
  },

  updateNode(id, updates) {
    const nodes = state.nodes.map((n) => {
      if (n.id !== id) return n;
      const newData = { ...n.data, ...updates };
      const position = axisToCanvas(newData.automationLevel, newData.criticalityLevel, state.canvasWidth, state.canvasHeight);
      return { ...n, type: newData.nodeType, position, data: newData };
    });
    setState({ nodes });
  },

  updateNodePosition(id, x, y) {
    const { automation, criticality } = canvasToAxis(x, y, state.canvasWidth, state.canvasHeight);
    const nodes = state.nodes.map((n) => {
      if (n.id !== id) return n;
      return {
        ...n,
        position: { x, y },
        data: { ...n.data, automationLevel: automation, criticalityLevel: criticality },
      };
    });
    setState({ nodes });
  },

  deleteNode(id) {
    const nodes = state.nodes.filter((n) => n.id !== id);
    const edges = state.edges.filter((e) => e.source !== id && e.target !== id);
    const wasSelected = state.selectedNodeId === id;
    setState({
      nodes, edges,
      selectedNodeId: wasSelected ? null : state.selectedNodeId,
      activePanel: wasSelected ? 'none' : state.activePanel,
      traceAncestors: wasSelected ? [] : state.traceAncestors,
      traceDescendants: wasSelected ? [] : state.traceDescendants,
    });
  },

  addEdge(edge) { setState({ edges: [...state.edges, edge] }); },

  updateEdge(id, updates) {
    const edges = state.edges.map((e) =>
      e.id === id ? { ...e, data: { ...e.data, ...updates } } : e
    );
    setState({ edges });
  },

  deleteEdge(id) {
    const edges = state.edges.filter((e) => e.id !== id);
    const wasSelected = state.selectedEdgeId === id;
    setState({
      edges,
      selectedEdgeId: wasSelected ? null : state.selectedEdgeId,
      activePanel: wasSelected ? 'none' : state.activePanel,
    });
  },

  selectNode(id) {
    const nodes = state.nodes.map((n) => ({ ...n, data: { ...n.data, selected: n.id === id } }));
    setState({
      nodes,
      selectedNodeId: id,
      selectedEdgeId: null,
      traceAncestors: id ? computeAncestors(id, state.edges) : [],
      traceDescendants: id ? computeDescendants(id, state.edges) : [],
      activePanel: id ? 'node' : 'none',
    });
  },

  selectEdge(id) {
    const nodes = state.nodes.map((n) => ({ ...n, data: { ...n.data, selected: false } }));
    setState({
      nodes,
      selectedEdgeId: id,
      selectedNodeId: null,
      traceAncestors: [],
      traceDescendants: [],
      activePanel: id ? 'edge' : 'none',
    });
  },

  setActivePanel(panel) {
    if (panel !== 'node' && panel !== 'edge') {
      const nodes = state.nodes.map((n) => ({ ...n, data: { ...n.data, selected: false } }));
      setState({ activePanel: panel, selectedNodeId: null, selectedEdgeId: null, nodes,
                 traceAncestors: [], traceDescendants: [] });
    } else {
      setState({ activePanel: panel });
    }
  },

  toggleOverlay(overlay) {
    setState({ overlays: { ...state.overlays, [overlay]: !state.overlays[overlay] } });
  },

  setFilters(patch) { setState({ filters: { ...state.filters, ...patch } }); },
  resetFilters() { setState({ filters: { ...DEFAULT_FILTERS } }); },

  setMapName(name) { setState({ mapName: name }); },

  loadSeedData(seed) {
    setState({
      nodes: seed.nodes,
      edges: seed.edges,
      selectedNodeId: null,
      selectedEdgeId: null,
      activePanel: 'none',
    });
  },

  importMap({ nodes, edges }) {
    const positioned = nodes.map((n) => ({
      ...n,
      type: n.type ?? n.data.nodeType,
      position: axisToCanvas(
        n.data.automationLevel,
        n.data.criticalityLevel,
        state.canvasWidth,
        state.canvasHeight,
      ),
    }));
    // Resolve overlaps by nudging downward.
    const placed = [];
    const placedNodes = positioned.map((n) => {
      let { x, y } = n.position;
      for (let attempt = 0; attempt < 30; attempt++) {
        const blocked = placed.some((p) =>
          Math.abs(p.x - x) < NODE_WIDTH + 8 && Math.abs(p.y - y) < NODE_HEIGHT + 8
        );
        if (!blocked) break;
        y += NODE_HEIGHT + 8;
      }
      placed.push({ x, y });
      return { ...n, position: { x, y } };
    });
    setState({
      nodes: placedNodes,
      edges,
      selectedNodeId: null,
      selectedEdgeId: null,
      activePanel: 'none',
      traceAncestors: [],
      traceDescendants: [],
    });
  },

  triggerFitView() { setState({ fitViewTrigger: state.fitViewTrigger + 1 }); },
  toggleGridLock() { setState({ gridLocked: !state.gridLocked }); },
  toggleNodesLocked() { setState({ nodesLocked: !state.nodesLocked }); },
  toggleShowStepNumbers() { setState({ showStepNumbers: !state.showStepNumbers }); },

  setCanvasSize(width, height) {
    const nodes = state.nodes.map((n) => ({
      ...n,
      position: axisToCanvas(n.data.automationLevel, n.data.criticalityLevel, width, height),
    }));
    setState({ canvasWidth: width, canvasHeight: height, nodes });
  },

  newMap() {
    setState({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      activePanel: 'none',
      mapName: 'Untitled Map',
      overlays: { ...DEFAULT_OVERLAYS },
      filters: { ...DEFAULT_FILTERS },
      canvasWidth: 1200,
      canvasHeight: 900,
      gridLocked: true,
      fitViewTrigger: 0,
      traceAncestors: [],
      traceDescendants: [],
    });
  },
};

// Filter helper (returns { id -> { visible, faded } }).
export function getNodeVisibility() {
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
