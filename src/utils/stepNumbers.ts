import { Node, Edge } from 'reactflow';
import { NodeData, EdgeData } from '../types';

const FLOW_TYPES = new Set(['triggers', 'transfersTo']);

/**
 * Derives step numbers for nodes that participate in the flow (triggers /
 * transfersTo edges). Nodes connected only via informs / constrains / reviews
 * / escalatesTo are context nodes and receive no step number.
 *
 * Main sequence:   1, 2, 3, ...
 * Branches:        2a, 2b, ... (when a node has multiple outgoing flow edges)
 * Converging paths continue the main sequence from the counter.
 *
 * Manual overrides (node.data.stepOverride) are applied after computation.
 */
export function computeStepNumbers(
  nodes: Node<NodeData>[],
  edges: Edge<EdgeData>[]
): Record<string, string> {
  const flowEdges = edges.filter(
    (e) => e.data && FLOW_TYPES.has(e.data.relationshipType)
  );

  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  nodes.forEach((n) => {
    outgoing.set(n.id, []);
    incoming.set(n.id, []);
  });

  for (const e of flowEdges) {
    outgoing.get(e.source)?.push(e.target);
    incoming.get(e.target)?.push(e.source);
  }

  // Only nodes that appear in at least one flow edge get a step number
  const inFlow = new Set<string>();
  for (const e of flowEdges) {
    inFlow.add(e.source);
    inFlow.add(e.target);
  }

  // Roots: in the flow graph, no incoming flow edges
  const roots = nodes
    .filter((n) => inFlow.has(n.id) && incoming.get(n.id)!.length === 0)
    .map((n) => n.id);

  const computed: Record<string, string> = {};
  const visited = new Set<string>();
  let counter = 0;

  function visit(id: string, branchLabel?: string) {
    if (visited.has(id)) return;
    visited.add(id);

    const label = branchLabel ?? String(++counter);
    computed[id] = label;

    const children = outgoing.get(id) ?? [];
    if (children.length === 1) {
      visit(children[0]);
    } else if (children.length > 1) {
      // Use the full current label as prefix so "1a" branches to "1aa"/"1ab",
      // not "1a"/"1b" (which collides with the current node's label).
      children.forEach((childId, i) => {
        visit(childId, `${label}${String.fromCharCode(97 + i)}`);
      });
    }
  }

  for (const rootId of roots) {
    visit(rootId);
  }

  // Handle cycles and subgraphs with no natural root (e.g. reapply loops).
  // Pick any unvisited flow node as a secondary root and continue numbering.
  for (const node of nodes) {
    if (inFlow.has(node.id) && !visited.has(node.id)) {
      visit(node.id);
    }
  }

  // Apply manual overrides
  const result: Record<string, string> = { ...computed };
  for (const node of nodes) {
    if (node.data.stepOverride != null && node.data.stepOverride.trim() !== '') {
      result[node.id] = node.data.stepOverride.trim();
    } else if (node.data.stepOverride === '') {
      // Empty string override = suppress the auto number
      delete result[node.id];
    }
  }

  return result;
}
