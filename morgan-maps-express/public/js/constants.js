// Shared constants — node/edge type metadata, scale labels, canvas presets.

export const NODE_TYPES = ['decision', 'evidence', 'execution', 'interface'];

export const NODE_TYPE_LABELS = {
  decision: 'Decision',
  evidence: 'Evidence',
  execution: 'Execution',
  interface: 'Interface',
};

export const NODE_TYPE_COLOURS = {
  decision: '#f59e0b',
  evidence: '#14b8a6',
  execution: '#7c3aed',
  interface: '#3b82f6',
};

export const RELATIONSHIP_TYPES = [
  'informs', 'constrains', 'triggers', 'transfersTo', 'reviews', 'escalatesTo',
];

export const RELATIONSHIP_LABELS = {
  informs: 'Informs',
  constrains: 'Constrains',
  triggers: 'Triggers',
  transfersTo: 'Transfers to',
  reviews: 'Reviews',
  escalatesTo: 'Escalates to',
};

export const RELATIONSHIP_SHORT = {
  informs:     "Provides information that shapes the other node's decision or action.",
  constrains:  'Sets rules or limits the other node must follow.',
  triggers:    'Causes the other node to start or activate.',
  transfersTo: 'Passes work or responsibility to the other node.',
  reviews:     "Checks or assures the other node's output.",
  escalatesTo: 'Passes work onward when more specialist or higher-level handling is needed.',
};

export const RELATIONSHIP_LONG = {
  informs:     "Provides information, evidence, or signals that shape the other node's decision or action.",
  constrains:  'Sets rules, limits, or conditions that the other node must operate within.',
  triggers:    'An event or completion here causes the other node to begin or activate.',
  transfersTo: 'Passes work, responsibility, ownership, or an actionable result to the other node.',
  reviews:     "Checks, verifies, audits, or quality-assures the other node's output or work.",
  escalatesTo: 'Passes work onward when thresholds, exceptions, or complexity require higher handling.',
};

export const EDGE_STYLES = {
  informs:     { stroke: '#94a3b8', strokeWidth: 1.5 },
  constrains:  { stroke: '#f43f5e', strokeWidth: 2,   strokeDasharray: '6 3' },
  triggers:    { stroke: '#3b82f6', strokeWidth: 2 },
  transfersTo: { stroke: '#10b981', strokeWidth: 2,   strokeDasharray: '5 3' },
  reviews:     { stroke: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '2 2' },
  escalatesTo: { stroke: '#f97316', strokeWidth: 3 },
};

export const EDGE_SHORT_LABELS = {
  informs:     'informs',
  constrains:  'constrains',
  triggers:    'triggers',
  transfersTo: 'transfers to',
  reviews:     'reviews',
  escalatesTo: 'escalates',
};

export const STATUSES = ['active', 'planned', 'deprecated', 'review'];

export const AUTOMATION_LABELS = [
  { value: 0,    label: 'Human-led' },
  { value: 0.25, label: 'Assisted' },
  { value: 0.5,  label: 'Part-automated' },
  { value: 0.75, label: 'Conditionally automated' },
  { value: 1.0,  label: 'Fully automated' },
];

export const CRITICALITY_LABELS = [
  { value: 0.1, label: 'Routine' },
  { value: 0.3, label: 'Operational' },
  { value: 0.5, label: 'Important' },
  { value: 0.7, label: 'High-impact' },
  { value: 0.9, label: 'Critical' },
];

export const CANVAS_SIZE_PRESETS = [
  { label: 'Small (800×600)',     w: 800,  h: 600 },
  { label: 'Standard (1200×900)', w: 1200, h: 900 },
  { label: 'Large (1600×1200)',   w: 1600, h: 1200 },
  { label: 'XL (2400×1800)',      w: 2400, h: 1800 },
];

export const X_BAND_LABELS = [
  'Human-led',
  'Assisted',
  'Part-automated',
  'Conditionally automated',
  'Fully automated',
];

export const Y_BAND_LABELS = ['Critical', 'High-Impact', 'Important', 'Operational', 'Routine'];

export function getAutomationLabel(value) {
  let closest = AUTOMATION_LABELS[0];
  let minDist = Math.abs(value - closest.value);
  for (const al of AUTOMATION_LABELS) {
    const d = Math.abs(value - al.value);
    if (d < minDist) { minDist = d; closest = al; }
  }
  return closest.label;
}

export function getCriticalityLabel(value) {
  let closest = CRITICALITY_LABELS[0];
  let minDist = Math.abs(value - closest.value);
  for (const cl of CRITICALITY_LABELS) {
    const d = Math.abs(value - cl.value);
    if (d < minDist) { minDist = d; closest = cl; }
  }
  return closest.label;
}
