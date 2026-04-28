import { Node, Edge } from 'reactflow';
import { NodeData, EdgeData } from '../types';

export interface MapExport {
  version: string;
  name: string;
  exportedAt: string;
  nodes: Node<NodeData>[];
  edges: Edge<EdgeData>[];
}

export function exportToJSON(
  name: string,
  nodes: Node<NodeData>[],
  edges: Edge<EdgeData>[]
): void {
  const data: MapExport = {
    version: '1.0',
    name,
    exportedAt: new Date().toISOString(),
    nodes,
    edges,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromJSON(file: File): Promise<MapExport> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as MapExport;
        resolve(data);
      } catch {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
