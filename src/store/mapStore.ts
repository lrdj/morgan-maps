import { create } from 'zustand';
import { Node, Edge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from 'reactflow';
import { NodeData, EdgeData, ActivePanel, OverlayType, FilterState, NodeType } from '../types';
import { SEED_NODES, SEED_EDGES } from '../data/seedData';
import { axisToCanvas, canvasToAxis, NODE_WIDTH, NODE_HEIGHT } from '../utils/coordinates';

const DEFAULT_FILTERS: FilterState = {
  nodeTypes: [],
  organisations: [],
  tags: [],
  criticalityRange: [0, 1],
  automationRange: [0, 1],
};

const ALL_OVERLAYS: Record<OverlayType, boolean> = {
  orgBoundaries: false,
  pathway: false,
  frictionPoints: false,
  policyConstraints: false,
  dataQuality: false,
};

export const CANVAS_SIZE_PRESETS = [
  { label: 'Small (800×600)', w: 800, h: 600 },
  { label: 'Standard (1200×900)', w: 1200, h: 900 },
  { label: 'Large (1600×1200)', w: 1600, h: 1200 },
  { label: 'XL (2400×1800)', w: 2400, h: 1800 },
];

interface MapStore {
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  traceAncestors: string[];
  traceDescendants: string[];
  activePanel: ActivePanel;
  overlays: Record<OverlayType, boolean>;
  filters: FilterState;
  mapName: string;
  fitViewTrigger: number;
  gridLocked: boolean;
  nodesLocked: boolean;
  canvasWidth: number;
  canvasHeight: number;

  // React Flow change handlers
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;

  // Node actions
  setNodes: (nodes: Node<NodeData>[]) => void;
  setEdges: (edges: Edge<EdgeData>[]) => void;
  addNode: (data: NodeData) => void;
  updateNode: (id: string, updates: Partial<NodeData>) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
  deleteNode: (id: string) => void;

  // Edge actions
  addEdge: (edge: Edge<EdgeData>) => void;
  updateEdge: (id: string, updates: Partial<EdgeData>) => void;
  deleteEdge: (id: string) => void;

  // Selection
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;

  // UI
  setActivePanel: (panel: ActivePanel) => void;
  toggleOverlay: (overlay: OverlayType) => void;

  // Filters
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;

  setMapName: (name: string) => void;

  // Data
  loadSeedData: () => void;
  importMap: (data: { nodes: Node<NodeData>[]; edges: Edge<EdgeData>[] }) => void;

  // Canvas
  triggerFitView: () => void;
  toggleGridLock: () => void;
  toggleNodesLocked: () => void;
  setCanvasSize: (width: number, height: number) => void;
  newMap: () => void;

  // Step numbers
  showStepNumbers: boolean;
  toggleShowStepNumbers: () => void;
}

let nodeIdCounter = 100;

function computeAncestors(id: string, edges: Edge<EdgeData>[]): string[] {
  const visited = new Set<string>();
  const queue = [id];
  while (queue.length) {
    const current = queue.shift()!;
    for (const e of edges) {
      if (e.target === current && !visited.has(e.source)) {
        visited.add(e.source);
        queue.push(e.source);
      }
    }
  }
  return Array.from(visited);
}

function computeDescendants(id: string, edges: Edge<EdgeData>[]): string[] {
  const visited = new Set<string>();
  const queue = [id];
  while (queue.length) {
    const current = queue.shift()!;
    for (const e of edges) {
      if (e.source === current && !visited.has(e.target)) {
        visited.add(e.target);
        queue.push(e.target);
      }
    }
  }
  return Array.from(visited);
}

export const useMapStore = create<MapStore>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  traceAncestors: [],
  traceDescendants: [],
  activePanel: 'none',
  overlays: { ...ALL_OVERLAYS },
  filters: { ...DEFAULT_FILTERS },
  mapName: 'Untitled Map',
  fitViewTrigger: 0,
  gridLocked: true,
  nodesLocked: false,
  canvasWidth: 1200,
  canvasHeight: 900,
  showStepNumbers: true,

  onNodesChange: (changes: NodeChange[]) => {
    set((state) => {
      const updated = applyNodeChanges(changes, state.nodes) as Node<NodeData>[];
      // Sync position changes back to axis values
      const synced = updated.map((node) => {
        const orig = state.nodes.find((n) => n.id === node.id);
        if (orig && (orig.position.x !== node.position.x || orig.position.y !== node.position.y)) {
          const { automation, criticality } = canvasToAxis(node.position.x, node.position.y, state.canvasWidth, state.canvasHeight);
          return {
            ...node,
            data: { ...node.data, automationLevel: automation, criticalityLevel: criticality },
          };
        }
        return node;
      });
      return { nodes: synced };
    });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges) as Edge<EdgeData>[],
    }));
  },

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (data: NodeData) => {
    const id = `node_${++nodeIdCounter}`;
    set((state) => {
      const position = axisToCanvas(data.automationLevel, data.criticalityLevel, state.canvasWidth, state.canvasHeight);
      const newNode: Node<NodeData> = {
        id,
        type: data.nodeType,
        position,
        data: { ...data, selected: false },
        draggable: true,
      };
      const nodes = [...state.nodes, newNode];
      return { nodes };
    });
  },

  updateNode: (id, updates) => {
    set((state) => {
      const nodes = state.nodes.map((n) => {
        if (n.id !== id) return n;
        const newData = { ...n.data, ...updates };
        const position = axisToCanvas(newData.automationLevel, newData.criticalityLevel, state.canvasWidth, state.canvasHeight);
        return {
          ...n,
          type: newData.nodeType,
          position,
          data: newData,
        };
      });
      return { nodes };
    });
  },

  updateNodePosition: (id, x, y) => {
    set((state) => {
      const { automation, criticality } = canvasToAxis(x, y, state.canvasWidth, state.canvasHeight);
      const nodes = state.nodes.map((n) => {
        if (n.id !== id) return n;
        return {
          ...n,
          position: { x, y },
          data: { ...n.data, automationLevel: automation, criticalityLevel: criticality },
        };
      });
      return { nodes };
    });
  },

  deleteNode: (id) => {
    set((state) => {
      const nodes = state.nodes.filter((n) => n.id !== id);
      const edges = state.edges.filter((e) => e.source !== id && e.target !== id);
      const selectedNodeId = state.selectedNodeId === id ? null : state.selectedNodeId;
      const activePanel = state.selectedNodeId === id ? 'none' : state.activePanel;
      return { nodes, edges, selectedNodeId, activePanel };
    });
  },

  addEdge: (edge) => {
    set((state) => {
      const edges = [...state.edges, edge];
      return { edges };
    });
  },

  updateEdge: (id, updates) => {
    set((state) => {
      const edges = state.edges.map((e) => {
        if (e.id !== id) return e;
        return { ...e, data: { ...e.data, ...updates } as EdgeData };
      });
      return { edges };
    });
  },

  deleteEdge: (id) => {
    set((state) => {
      const edges = state.edges.filter((e) => e.id !== id);
      const selectedEdgeId = state.selectedEdgeId === id ? null : state.selectedEdgeId;
      const activePanel = state.selectedEdgeId === id ? 'none' : state.activePanel;
      return { edges, selectedEdgeId, activePanel };
    });
  },

  selectNode: (id) => {
    set((state) => {
      const nodes = state.nodes.map((n) => ({
        ...n,
        data: { ...n.data, selected: n.id === id },
      }));
      const traceAncestors = id ? computeAncestors(id, state.edges) : [];
      const traceDescendants = id ? computeDescendants(id, state.edges) : [];
      return {
        nodes,
        selectedNodeId: id,
        selectedEdgeId: null,
        traceAncestors,
        traceDescendants,
        activePanel: id ? 'node' : 'none',
      };
    });
  },

  selectEdge: (id) => {
    set((state) => {
      const nodes = state.nodes.map((n) => ({
        ...n,
        data: { ...n.data, selected: false },
      }));
      return {
        nodes,
        selectedEdgeId: id,
        selectedNodeId: null,
        traceAncestors: [],
        traceDescendants: [],
        activePanel: id ? 'edge' : 'none',
      };
    });
  },

  setActivePanel: (panel) => {
    set((state) => {
      // deselect node/edge when switching to a non-node/edge panel
      if (panel !== 'node' && panel !== 'edge') {
        const nodes = state.nodes.map((n) => ({
          ...n,
          data: { ...n.data, selected: false },
        }));
        return { activePanel: panel, selectedNodeId: null, selectedEdgeId: null, nodes };
      }
      return { activePanel: panel };
    });
  },

  toggleOverlay: (overlay) => {
    set((state) => ({
      overlays: { ...state.overlays, [overlay]: !state.overlays[overlay] },
    }));
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  resetFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

  setMapName: (name) => set({ mapName: name }),

  loadSeedData: () => {
    set({
      nodes: SEED_NODES,
      edges: SEED_EDGES,
      selectedNodeId: null,
      selectedEdgeId: null,
      activePanel: 'none',
    });
  },

  importMap: (data) => {
    set((state) => {
      // Always derive position from axis values — position in the JSON may be
      // stale, wrong, or generated by an LLM that guessed pixel coordinates.
      const positioned = data.nodes.map((n) => ({
        ...n,
        type: n.type ?? n.data.nodeType,
        position: axisToCanvas(
          n.data.automationLevel,
          n.data.criticalityLevel,
          state.canvasWidth,
          state.canvasHeight
        ),
      }));

      // Resolve overlaps: if two nodes land within NODE_WIDTH × NODE_HEIGHT of
      // each other, nudge the later one downward until it clears.
      const placed: { x: number; y: number }[] = [];
      const nodes = positioned.map((n) => {
        let { x, y } = n.position;
        for (let attempt = 0; attempt < 30; attempt++) {
          const blocked = placed.some(
            (p) =>
              Math.abs(p.x - x) < NODE_WIDTH + 8 &&
              Math.abs(p.y - y) < NODE_HEIGHT + 8
          );
          if (!blocked) break;
          y += NODE_HEIGHT + 8;
        }
        placed.push({ x, y });
        return { ...n, position: { x, y } };
      });

      return {
        nodes,
        edges: data.edges,
        selectedNodeId: null,
        selectedEdgeId: null,
        activePanel: 'none',
      };
    });
  },

  triggerFitView: () => {
    set((state) => ({ fitViewTrigger: state.fitViewTrigger + 1 }));
  },

  toggleGridLock: () => set((state) => ({ gridLocked: !state.gridLocked })),
  toggleNodesLocked: () => set((state) => ({ nodesLocked: !state.nodesLocked })),
  toggleShowStepNumbers: () => set((state) => ({ showStepNumbers: !state.showStepNumbers })),

  setCanvasSize: (width, height) => {
    set((state) => {
      // Reposition all nodes proportionally using their normalised axis values
      const nodes = state.nodes.map((n) => ({
        ...n,
        position: axisToCanvas(n.data.automationLevel, n.data.criticalityLevel, width, height),
      }));
      return { canvasWidth: width, canvasHeight: height, nodes };
    });
  },

  newMap: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      activePanel: 'none',
      mapName: 'Untitled Map',
      overlays: { ...ALL_OVERLAYS },
      filters: { ...DEFAULT_FILTERS },
      canvasWidth: 1200,
      canvasHeight: 900,
      gridLocked: true,
      fitViewTrigger: 0,
    });
  },
}));

// Helper: get a filtered view of nodes for the canvas
export function getFilteredNodes(
  nodes: Node<NodeData>[],
  filters: FilterState,
  selectedNodeId?: string | null,
  traceAncestors?: string[],
  traceDescendants?: string[]
): Node<NodeData>[] {
  const tracingActive = !!selectedNodeId;
  const ancestorSet = new Set(traceAncestors ?? []);
  const descendantSet = new Set(traceDescendants ?? []);

  return nodes.map((node) => {
    const d = node.data;
    let visible = true;

    if (filters.nodeTypes.length > 0 && !filters.nodeTypes.includes(d.nodeType as NodeType)) {
      visible = false;
    }
    if (filters.organisations.length > 0 && !filters.organisations.includes(d.organisation)) {
      visible = false;
    }
    if (filters.tags.length > 0 && !filters.tags.some((t) => d.tags.includes(t))) {
      visible = false;
    }
    if (
      d.criticalityLevel < filters.criticalityRange[0] ||
      d.criticalityLevel > filters.criticalityRange[1]
    ) {
      visible = false;
    }
    if (
      d.automationLevel < filters.automationRange[0] ||
      d.automationLevel > filters.automationRange[1]
    ) {
      visible = false;
    }

    // Trace fading: if a node is selected, fade nodes not on the path
    const isSelected = node.id === selectedNodeId;
    const isOnPath = isSelected || ancestorSet.has(node.id) || descendantSet.has(node.id);
    const traceFade = tracingActive && !isOnPath;

    return {
      ...node,
      style: {
        ...node.style,
        opacity: !visible ? 0.15 : traceFade ? 0.15 : 1,
        pointerEvents: visible ? ('auto' as const) : ('none' as const),
      },
    };
  });
}
