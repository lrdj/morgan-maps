import { Node, Edge } from 'reactflow';
import { NodeData, EdgeData } from '../types';

const STORAGE_KEY = 'morgan-map:saves';

export interface SavedMap {
  id: string;
  name: string;
  savedAt: string; // ISO string
  canvasWidth: number;
  canvasHeight: number;
  gridLocked: boolean;
  nodeCount: number;
  edgeCount: number;
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
}

export function listSavedMaps(): SavedMap[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedMap[];
  } catch {
    return [];
  }
}

export function saveMap(map: Omit<SavedMap, 'id' | 'savedAt' | 'nodeCount' | 'edgeCount'>): SavedMap {
  const saves = listSavedMaps();
  // Replace existing save with same name, or append
  const existing = saves.findIndex((s) => s.name === map.name);
  const entry: SavedMap = {
    ...map,
    id: existing >= 0 ? saves[existing].id : `map_${Date.now()}`,
    savedAt: new Date().toISOString(),
    nodeCount: map.nodes.length,
    edgeCount: map.edges.length,
  };
  if (existing >= 0) {
    saves[existing] = entry;
  } else {
    saves.unshift(entry);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
  return entry;
}

export function deleteSavedMap(id: string): void {
  const saves = listSavedMaps().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
}

export function formatSavedAt(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
