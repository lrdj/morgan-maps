import { Node, Edge } from 'reactflow';
import { NodeData, EdgeData } from '../types';
import { axisToCanvas } from '../utils/coordinates';

function makeNode(
  id: string,
  data: Omit<NodeData, 'selected'>,
  extra: Partial<NodeData> = {}
): Node<NodeData> {
  const pos = axisToCanvas(data.automationLevel, data.criticalityLevel);
  return {
    id,
    type: data.nodeType,
    position: pos,
    data: { ...data, selected: false, ...extra },
    draggable: true,
  };
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  data: Partial<EdgeData>
): Edge<EdgeData> {
  return {
    id,
    source,
    target,
    type: 'relationship',
    data: {
      relationshipType: data.relationshipType ?? 'informs',
      description: data.description ?? '',
      interoperabilityNote: data.interoperabilityNote ?? '',
    },
  };
}

export const SEED_NODES: Node<NodeData>[] = [
  makeNode('n1', {
    title: 'Online Claim Form',
    description:
      'Citizen-facing web form for initiating a Universal Credit claim. Accessible 24/7 via GOV.UK.',
    nodeType: 'interface',
    owner: 'Digital Services Team',
    organisation: 'DWP',
    tags: ['citizen-facing', 'digital', 'channel'],
    status: 'active',
    confidenceScore: 0.9,
    notes: 'High drop-off rate at evidence upload step. UX review scheduled.',
    automationLevel: 0.15,
    criticalityLevel: 0.25,
    overlays: { frictionPoints: true },
  }),

  makeNode('n2', {
    title: 'GOV.UK One Login',
    description:
      'Shared identity verification and authentication platform. Federated across government services.',
    nodeType: 'execution',
    owner: 'GOV.UK Identity',
    organisation: 'GDS / Cabinet Office',
    tags: ['identity', 'shared', 'cross-boundary'],
    status: 'active',
    confidenceScore: 0.85,
    notes:
      'Planned migration from legacy Verify. Some agencies still using interim solutions.',
    automationLevel: 0.78,
    criticalityLevel: 0.78,
    overlays: { orgBoundaries: true },
  }),

  makeNode('n3', {
    title: 'Initial Eligibility Decision',
    description:
      'Rules-based assessment of whether claimant meets basic eligibility criteria (age, residency, work status).',
    nodeType: 'decision',
    owner: 'Case Processing',
    organisation: 'DWP',
    tags: ['automated', 'rules-engine', 'eligibility'],
    status: 'active',
    confidenceScore: 0.75,
    notes:
      'Edge cases around non-standard living arrangements handled manually. Accuracy review pending.',
    automationLevel: 0.58,
    criticalityLevel: 0.72,
    overlays: {},
  }),

  makeNode('n4', {
    title: 'Fraud & Error Risk Score',
    description:
      'ML model that scores new claims for fraud risk indicators. Score influences processing route.',
    nodeType: 'evidence',
    owner: 'Counter Fraud Intelligence',
    organisation: 'DWP',
    tags: ['AI', 'fraud', 'risk-scoring', 'automated'],
    status: 'active',
    confidenceScore: 0.55,
    notes:
      'Model trained on historical fraud data. Known bias risks under review. Disproportionate impact on certain demographics flagged by internal audit.',
    automationLevel: 0.88,
    criticalityLevel: 0.88,
    overlays: {},
  }),

  makeNode('n5', {
    title: 'Medical Evidence Review',
    description:
      'Case worker assessment of medical evidence submitted to support a Limited Capability for Work claim.',
    nodeType: 'decision',
    owner: 'Health Assessment Team',
    organisation: 'DWP',
    tags: ['human-judgement', 'medical', 'sensitive'],
    status: 'active',
    confidenceScore: 0.7,
    notes: 'Relies on third-party GP evidence which is often delayed or incomplete.',
    automationLevel: 0.12,
    criticalityLevel: 0.92,
    overlays: { frictionPoints: true, policyConstraints: true },
  }),

  makeNode('n6', {
    title: 'Benefit Calculation Engine',
    description:
      'Automated system that calculates entitlement amount based on household composition, earnings, and deductions.',
    nodeType: 'execution',
    owner: 'Payments Architecture',
    organisation: 'DWP',
    tags: ['automated', 'calculation', 'financial'],
    status: 'active',
    confidenceScore: 0.92,
    notes:
      'Complex tariff logic updated at each budget cycle. Change control is manual and error-prone.',
    automationLevel: 0.92,
    criticalityLevel: 0.68,
    overlays: {},
  }),

  makeNode('n7', {
    title: 'Case Worker Dashboard',
    description:
      'Internal tool for case workers to view, action, and annotate claims. Gateway to manual interventions.',
    nodeType: 'interface',
    owner: 'Digital Services Team',
    organisation: 'DWP',
    tags: ['internal', 'casework', 'digital'],
    status: 'active',
    confidenceScore: 0.8,
    notes:
      'Legacy system. Limited search capability. Integration with real-time earnings data is unreliable.',
    automationLevel: 0.38,
    criticalityLevel: 0.52,
    overlays: {},
  }),

  makeNode('n8', {
    title: 'Mandatory Reconsideration',
    description:
      'Formal internal review of a decision the claimant disputes, before an external appeal.',
    nodeType: 'decision',
    owner: 'MR & Appeals Team',
    organisation: 'DWP',
    tags: ['legal', 'human-judgement', 'review'],
    status: 'active',
    confidenceScore: 0.65,
    notes: 'High overturn rate suggests upstream decision quality issues.',
    automationLevel: 0.08,
    criticalityLevel: 0.9,
    overlays: { policyConstraints: true },
  }),

  makeNode('n9', {
    title: 'Independent Tribunal Appeal',
    description:
      'External judicial appeal heard by an independent tribunal. Legally binding determination.',
    nodeType: 'decision',
    owner: 'Judicial Panel',
    organisation: 'HMCTS',
    tags: ['legal', 'external', 'judicial', 'cross-boundary'],
    status: 'active',
    confidenceScore: 0.95,
    notes:
      'Entirely independent of DWP. Overturn rate circa 60%. Signals systemic decision quality issues.',
    automationLevel: 0.04,
    criticalityLevel: 0.97,
    overlays: { orgBoundaries: true },
  }),

  makeNode('n10', {
    title: 'Monthly Payment Run',
    description:
      'Automated BACS payment instruction to claimant bank account on assessment period end date.',
    nodeType: 'execution',
    owner: 'Payments Operations',
    organisation: 'DWP / BACS',
    tags: ['automated', 'financial', 'cross-boundary'],
    status: 'active',
    confidenceScore: 0.95,
    notes: 'Near-zero error rate. Occasional failures when bank details stale.',
    automationLevel: 0.97,
    criticalityLevel: 0.55,
    overlays: {},
  }),

  makeNode('n11', {
    title: 'Claimant Notifications',
    description:
      'Automated letters, texts, and journal messages sent at key milestones in claim lifecycle.',
    nodeType: 'interface',
    owner: 'Communications',
    organisation: 'DWP',
    tags: ['automated', 'citizen-facing', 'notification'],
    status: 'active',
    confidenceScore: 0.82,
    notes: 'Notification content often confusing. High call volumes after notification events.',
    automationLevel: 0.88,
    criticalityLevel: 0.28,
    overlays: { frictionPoints: true },
  }),

  makeNode('n12', {
    title: 'Policy Rules Engine',
    description:
      'Centralised rules repository encoding legislation and DWP policy. Drives eligibility and calculation logic.',
    nodeType: 'evidence',
    owner: 'Policy & Legislation',
    organisation: 'DWP Policy',
    tags: ['policy', 'legislation', 'rules'],
    status: 'active',
    confidenceScore: 0.72,
    notes:
      'Maintained by policy team, not engineering. Changes lag behind legislation. No automated testing suite.',
    automationLevel: 0.68,
    criticalityLevel: 0.85,
    overlays: { policyConstraints: true },
  }),

  makeNode('n13', {
    title: 'GP Medical Report',
    description:
      'Third-party evidence from GP or specialist supporting medical condition claim.',
    nodeType: 'interface',
    owner: 'GP Practice',
    organisation: 'NHS',
    tags: ['third-party', 'medical', 'cross-boundary', 'paper'],
    status: 'active',
    confidenceScore: 0.5,
    notes: 'Often received as scanned PDFs. Variable quality. Average wait 3–6 weeks.',
    automationLevel: 0.22,
    criticalityLevel: 0.82,
    overlays: { orgBoundaries: true, dataQuality: true },
  }),

  makeNode('n14', {
    title: 'Claimant Record Store',
    description:
      'Canonical data store for claimant identity, history, household, and claim state.',
    nodeType: 'evidence',
    owner: 'Data Platform',
    organisation: 'DWP',
    tags: ['data', 'core', 'sensitive'],
    status: 'active',
    confidenceScore: 0.85,
    notes: 'Multiple legacy systems feed into this. Data quality varies by source system.',
    automationLevel: 0.72,
    criticalityLevel: 0.62,
    overlays: { dataQuality: true },
  }),

  makeNode('n15', {
    title: 'Real-Time Earnings Feed',
    description:
      'HMRC PAYE data fed into Universal Credit calculation each assessment period.',
    nodeType: 'evidence',
    owner: 'HMRC PAYE Service',
    organisation: 'HMRC',
    tags: ['data', 'cross-boundary', 'automated', 'financial'],
    status: 'active',
    confidenceScore: 0.88,
    notes: 'Coverage gap for self-employed earners. Manual declarations required.',
    automationLevel: 0.93,
    criticalityLevel: 0.72,
    overlays: { orgBoundaries: true },
  }),

  makeNode('n16', {
    title: 'Document Classification AI',
    description:
      'NLP model that classifies incoming documents and routes them to the correct case queue.',
    nodeType: 'execution',
    owner: 'AI Capabilities',
    organisation: 'DWP',
    tags: ['AI', 'document', 'routing'],
    status: 'planned',
    confidenceScore: 0.45,
    notes:
      'In pilot. Accuracy circa 78%. Misclassifications create significant manual rework.',
    automationLevel: 0.82,
    criticalityLevel: 0.45,
    overlays: {},
  }),

  makeNode('n17', {
    title: 'Case Supervisor Review',
    description:
      'Senior case worker oversight of complex or high-risk cases before decision is issued.',
    nodeType: 'execution',
    owner: 'Operations Management',
    organisation: 'DWP',
    tags: ['human-judgement', 'oversight', 'quality'],
    status: 'active',
    confidenceScore: 0.78,
    notes: 'Supervisor capacity is a bottleneck. Average 8-day queue for escalated cases.',
    automationLevel: 0.1,
    criticalityLevel: 0.85,
    overlays: {},
  }),

  makeNode('n18', {
    title: 'Audit & Compliance Logs',
    description:
      'Automated logging of all system decisions, overrides, and case actions for internal audit.',
    nodeType: 'evidence',
    owner: 'Internal Audit',
    organisation: 'DWP',
    tags: ['audit', 'compliance', 'automated'],
    status: 'active',
    confidenceScore: 0.82,
    notes: 'Log coverage is incomplete for legacy system actions. Gaps identified in 2023 audit.',
    automationLevel: 0.78,
    criticalityLevel: 0.58,
    overlays: { policyConstraints: true },
  }),

  makeNode('n19', {
    title: 'Case Object: UC Claim',
    description:
      'The canonical claim record that persists across the entire lifecycle of a Universal Credit case.',
    nodeType: 'evidence',
    owner: 'Case Management',
    organisation: 'DWP',
    tags: ['case', 'lifecycle', 'core'],
    status: 'active',
    confidenceScore: 0.9,
    notes: '',
    automationLevel: 0.5,
    criticalityLevel: 0.62,
    overlays: {},
  }),

  makeNode('n20', {
    title: 'Triage & Routing Engine',
    description:
      'Routes new claims to appropriate processing queue based on complexity indicators and fraud score.',
    nodeType: 'execution',
    owner: 'Operations',
    organisation: 'DWP',
    tags: ['routing', 'triage', 'automated'],
    status: 'active',
    confidenceScore: 0.7,
    notes:
      'Routing logic is opaque. Difficult to audit or challenge. No user-facing explanation of routing decision.',
    automationLevel: 0.72,
    criticalityLevel: 0.68,
    overlays: {},
  }),
];

export const SEED_EDGES: Edge<EdgeData>[] = [
  makeEdge('e1', 'n1', 'n2', {
    relationshipType: 'triggers',
    description: 'Claim form submission triggers identity verification',
  }),
  makeEdge('e2', 'n2', 'n3', {
    relationshipType: 'informs',
    description: 'Verified identity passed to eligibility decision',
  }),
  makeEdge('e3', 'n4', 'n3', {
    relationshipType: 'informs',
    description: 'Fraud risk score informs eligibility routing',
    interoperabilityNote: 'Score is opaque to case workers',
  }),
  makeEdge('e4', 'n3', 'n20', {
    relationshipType: 'triggers',
    description: 'Eligibility decision triggers claim triage and routing',
  }),
  makeEdge('e5', 'n20', 'n7', {
    relationshipType: 'transfersTo',
    description: 'Complex cases routed to case worker queue',
  }),
  makeEdge('e6', 'n20', 'n6', {
    relationshipType: 'triggers',
    description: 'Simple eligible claims route directly to calculation',
  }),
  makeEdge('e7', 'n12', 'n3', {
    relationshipType: 'constrains',
    description: 'Policy rules constrain eligibility criteria',
  }),
  makeEdge('e8', 'n12', 'n6', {
    relationshipType: 'constrains',
    description: 'Policy rules constrain calculation methodology',
  }),
  makeEdge('e9', 'n15', 'n6', {
    relationshipType: 'informs',
    description: 'Real-time earnings data feeds into monthly calculation',
    interoperabilityNote: 'HMRC data via API. No coverage for self-employed.',
  }),
  makeEdge('e10', 'n6', 'n10', {
    relationshipType: 'triggers',
    description: 'Completed calculation triggers payment instruction',
  }),
  makeEdge('e11', 'n10', 'n11', {
    relationshipType: 'triggers',
    description: 'Payment processed triggers claimant notification',
  }),
  makeEdge('e12', 'n7', 'n17', {
    relationshipType: 'escalatesTo',
    description: 'Case workers escalate complex cases for supervisor review',
  }),
  makeEdge('e13', 'n17', 'n5', {
    relationshipType: 'triggers',
    description: 'Supervisor triggers medical evidence review for qualifying conditions',
  }),
  makeEdge('e14', 'n13', 'n5', {
    relationshipType: 'informs',
    description: 'GP report informs medical evidence review decision',
    interoperabilityNote: 'NHS to DWP. Paper-based. No structured data exchange.',
  }),
  makeEdge('e15', 'n5', 'n17', {
    relationshipType: 'reviews',
    description: 'Medical evidence review outcomes reviewed by supervisor',
  }),
  makeEdge('e16', 'n16', 'n7', {
    relationshipType: 'informs',
    description: 'Document classifier routes documents into case worker view',
  }),
  makeEdge('e17', 'n14', 'n7', {
    relationshipType: 'informs',
    description: 'Claimant record data displayed in case worker dashboard',
  }),
  makeEdge('e18', 'n3', 'n8', {
    relationshipType: 'triggers',
    description: 'Adverse eligibility decision can trigger mandatory reconsideration',
  }),
  makeEdge('e19', 'n8', 'n9', {
    relationshipType: 'escalatesTo',
    description: 'Failed MR escalates to independent tribunal appeal',
    interoperabilityNote: 'DWP to HMCTS case file transfer. Manual process.',
  }),
  makeEdge('e20', 'n18', 'n17', {
    relationshipType: 'informs',
    description: 'Audit logs inform supervisor case review quality checks',
  }),
  makeEdge('e21', 'n19', 'n14', {
    relationshipType: 'informs',
    description: 'Case object state reflected in claimant record',
  }),
  makeEdge('e22', 'n2', 'n4', {
    relationshipType: 'informs',
    description: 'Identity verification outcome included in fraud scoring',
  }),
];
