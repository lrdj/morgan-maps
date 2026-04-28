export type NodeType =
  | 'decision'
  | 'evidence'
  | 'execution'
  | 'interface';

export type RelationshipType =
  | 'informs'
  | 'constrains'
  | 'triggers'
  | 'transfersTo'
  | 'reviews'
  | 'escalatesTo';

export type OverlayType =
  | 'orgBoundaries'
  | 'pathway'
  | 'frictionPoints'
  | 'policyConstraints'
  | 'dataQuality';

export type Status = 'active' | 'planned' | 'deprecated' | 'review';

export interface NodeData {
  title: string;
  description: string;
  nodeType: NodeType;
  owner: string;
  organisation: string;
  tags: string[];
  status: Status;
  confidenceScore: number; // 0–1
  notes: string;
  automationLevel: number; // 0–1 (x axis — extent of automation)
  criticalityLevel: number; // 0–1 (y axis — trust required)
  overlays: Partial<Record<OverlayType, boolean>>;
  selected?: boolean;
  stepOverride?: string | null; // null = auto-derive; '' = suppress; any string = manual label
}

export interface EdgeData {
  relationshipType: RelationshipType;
  description: string;
  interoperabilityNote: string;
}

export type FilterState = {
  nodeTypes: NodeType[];
  organisations: string[];
  tags: string[];
  criticalityRange: [number, number];
  automationRange: [number, number];
};

export type ActivePanel = 'none' | 'node' | 'edge' | 'risks' | 'overlays' | 'filters' | 'views' | 'help';

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  decision: 'Decision',
  evidence: 'Evidence',
  execution: 'Execution',
  interface: 'Interface',
};

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  informs: 'Informs',
  constrains: 'Constrains',
  triggers: 'Triggers',
  transfersTo: 'Transfers to',
  reviews: 'Reviews',
  escalatesTo: 'Escalates to',
};

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
