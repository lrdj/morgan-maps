const FLOW_TYPES = new Set(['triggers', 'transfersTo']);

export function computeStepNumbers(nodes, edges) {
  const flowEdges = edges.filter((e) => e.data && FLOW_TYPES.has(e.data.relationshipType));

  const outgoing = new Map();
  const incoming = new Map();
  nodes.forEach((n) => { outgoing.set(n.id, []); incoming.set(n.id, []); });
  for (const e of flowEdges) {
    outgoing.get(e.source)?.push(e.target);
    incoming.get(e.target)?.push(e.source);
  }

  const inFlow = new Set();
  for (const e of flowEdges) { inFlow.add(e.source); inFlow.add(e.target); }

  const roots = nodes
    .filter((n) => inFlow.has(n.id) && incoming.get(n.id).length === 0)
    .map((n) => n.id);

  const computed = {};
  const visited = new Set();
  let counter = 0;

  function visit(id, branchLabel) {
    if (visited.has(id)) return;
    visited.add(id);
    const label = branchLabel ?? String(++counter);
    computed[id] = label;
    const children = outgoing.get(id) ?? [];
    if (children.length === 1) {
      visit(children[0]);
    } else if (children.length > 1) {
      children.forEach((childId, i) => visit(childId, `${label}${String.fromCharCode(97 + i)}`));
    }
  }

  for (const rootId of roots) visit(rootId);
  for (const node of nodes) {
    if (inFlow.has(node.id) && !visited.has(node.id)) visit(node.id);
  }

  const result = { ...computed };
  for (const node of nodes) {
    const o = node.data.stepOverride;
    if (o != null && String(o).trim() !== '') {
      result[node.id] = String(o).trim();
    } else if (o === '') {
      delete result[node.id];
    }
  }
  return result;
}
