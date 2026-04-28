import { useState, useMemo } from 'react';
import { X, Tag, Trash2, Pencil, Check } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { NodeData, NodeType, Status, NODE_TYPE_LABELS, AUTOMATION_LABELS, CRITICALITY_LABELS } from '../../types';
import { computeStepNumbers } from '../../utils/stepNumbers';

function getAutomationLabel(value: number): string {
  let closest = AUTOMATION_LABELS[0];
  let minDist = Math.abs(value - closest.value);
  for (const al of AUTOMATION_LABELS) {
    const dist = Math.abs(value - al.value);
    if (dist < minDist) { minDist = dist; closest = al; }
  }
  return closest.label;
}

function getCriticalityLabel(value: number): string {
  let closest = CRITICALITY_LABELS[0];
  let minDist = Math.abs(value - closest.value);
  for (const cl of CRITICALITY_LABELS) {
    const dist = Math.abs(value - cl.value);
    if (dist < minDist) { minDist = dist; closest = cl; }
  }
  return closest.label;
}


const STATUS_COLOURS: Record<Status, string> = {
  active: 'bg-green-100 text-green-700',
  planned: 'bg-blue-100 text-blue-700',
  deprecated: 'bg-gray-100 text-gray-500',
  review: 'bg-yellow-100 text-yellow-700',
};

const NODE_TYPE_COLOURS: Record<NodeType, string> = {
  decision: '#f59e0b',
  evidence: '#14b8a6',
  execution: '#7c3aed',
  interface: '#3b82f6',
};

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const colour = value > 0.7 ? '#10b981' : value > 0.5 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: colour }} />
      </div>
      <span className="text-[11px] font-medium text-gray-600 w-7 text-right">{pct}%</span>
    </div>
  );
}

export function NodeDetailPanel() {
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const nodes = useMapStore((s) => s.nodes);
  const edges = useMapStore((s) => s.edges);
  const updateNode = useMapStore((s) => s.updateNode);
  const deleteNode = useMapStore((s) => s.deleteNode);
  const selectNode = useMapStore((s) => s.selectNode);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<NodeData>>({});

  const node = nodes.find((n) => n.id === selectedNodeId);
  const stepNumbers = useMemo(() => computeStepNumbers(nodes, edges), [nodes, edges]);
  if (!node) return null;

  const autoStep = stepNumbers[node.id];

  const d = node.data;
  const color = NODE_TYPE_COLOURS[d.nodeType];

  const connectedEdges = edges.filter((e) => e.source === node.id || e.target === node.id);

  // Merge draft over live data so sliders feel instant
  const v: NodeData = { ...d, ...draft };

  const set = <K extends keyof NodeData>(key: K, value: NodeData[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    // Sliders update immediately so position moves in real time
    if (key === 'automationLevel' || key === 'criticalityLevel') {
      updateNode(node.id, { [key]: value });
    }
  };

  const startEditing = () => {
    setDraft({});
    setEditing(true);
  };

  const commitEditing = () => {
    if (Object.keys(draft).length > 0) {
      updateNode(node.id, draft);
    }
    setDraft({});
    setEditing(false);
  };

  const cancelEditing = () => {
    setDraft({});
    setEditing(false);
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !v.tags.includes(trimmed)) {
      const tags = [...v.tags, trimmed];
      set('tags', tags);
      updateNode(node.id, { tags });
    }
  };

  const removeTag = (tag: string) => {
    const tags = v.tags.filter((t) => t !== tag);
    set('tags', tags);
    updateNode(node.id, { tags });
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 w-[380px] flex-shrink-0 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="flex-1 min-w-0">
          <div
            className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide mb-1"
            style={{ backgroundColor: `${color}22`, color }}
          >
            {NODE_TYPE_LABELS[d.nodeType]}
          </div>
          <h2 className="text-base font-semibold text-gray-900 leading-snug pr-1">
            {d.title}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">{d.organisation || '—'}</p>
        </div>

        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {editing ? (
            <>
              <button
                onClick={cancelEditing}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Cancel"
              >
                <X size={15} />
              </button>
              <button
                onClick={commitEditing}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
                title="Save changes"
              >
                <Check size={13} />
                Save
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => deleteNode(node.id)}
                className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                title="Delete node"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={startEditing}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                title="Edit node"
              >
                <Pencil size={12} />
                Edit
              </button>
              <button
                onClick={() => selectNode(null)}
                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

        {editing ? (
          /* ═══ EDIT MODE — mirrors Create Node layout ═══ */
          <>
            {/* Title */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                value={v.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="Node title"
              />
            </div>

            {/* Step override */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Step number</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                value={v.stepOverride ?? ''}
                onChange={(e) => set('stepOverride', e.target.value || null)}
                placeholder={autoStep ? `Auto: ${autoStep} — leave blank to keep` : 'e.g. 1, 2a, 3b (leave blank for auto)'}
              />
              <p className="text-[10px] text-gray-400 mt-1">Leave blank to use the auto-derived step number. Clear to remove any override.</p>
            </div>

            {/* Node Type + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Node Type</label>
                <select
                  value={v.nodeType}
                  onChange={(e) => set('nodeType', e.target.value as NodeType)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white"
                >
                  {(Object.keys(NODE_TYPE_LABELS) as NodeType[]).map((t) => (
                    <option key={t} value={t}>{NODE_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</label>
                <select
                  value={v.status}
                  onChange={(e) => set('status', e.target.value as Status)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 bg-white"
                >
                  {(['active', 'planned', 'deprecated', 'review'] as Status[]).map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Organisation + Owner */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Organisation</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  value={v.organisation}
                  onChange={(e) => set('organisation', e.target.value)}
                  placeholder="e.g. DWP, HMRC"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Owner</label>
                <input
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                  value={v.owner}
                  onChange={(e) => set('owner', e.target.value)}
                  placeholder="Team or person"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</label>
              <textarea
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                value={v.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="What does this node do?"
              />
            </div>

            {/* Automation slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-semibold text-gray-500 uppercase tracking-wide">Automation</span>
                <span className="font-medium text-purple-600">
                  {getAutomationLabel(v.automationLevel)}
                </span>
              </div>
              <input
                type="range" min={0} max={4} step={1}
                value={Math.round(v.automationLevel * 4)}
                onChange={(e) => set('automationLevel', Number(e.target.value) / 4)}
                className="w-full h-2 accent-purple-500"
              />
              <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                <span>Human-led</span><span>Fully automated</span>
              </div>
            </div>

            {/* Criticality slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-semibold text-gray-500 uppercase tracking-wide">Criticality</span>
                <span className="font-medium text-red-500">
                  {Math.round(v.criticalityLevel * 100)}% — {getCriticalityLabel(v.criticalityLevel)}
                </span>
              </div>
              <input
                type="range" min={0} max={100}
                value={Math.round(v.criticalityLevel * 100)}
                onChange={(e) => set('criticalityLevel', Number(e.target.value) / 100)}
                className="w-full h-2 accent-red-400"
              />
              <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                <span>Low trust needed</span><span>High trust needed</span>
              </div>
            </div>

            {/* Confidence slider */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-semibold text-gray-500 uppercase tracking-wide">Mapping confidence</span>
                <span className="font-medium text-blue-600">{Math.round(v.confidenceScore * 100)}%</span>
              </div>
              <input
                type="range" min={0} max={100}
                value={Math.round(v.confidenceScore * 100)}
                onChange={(e) => set('confidenceScore', Number(e.target.value) / 100)}
                className="w-full h-2 accent-blue-500"
              />
              <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
                <span>Tentative</span><span>High confidence</span>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Tags</label>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {v.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-medium">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add tags (comma-separated or press Enter)"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addTag((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</label>
              <textarea
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
                value={v.notes || ''}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Internal notes or observations"
              />
            </div>
          </>
        ) : (
          /* ═══ VIEW MODE ═══ */
          <>
            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Status</div>
                <span className={`text-[11px] font-semibold rounded px-1.5 py-0.5 ${STATUS_COLOURS[d.status]}`}>
                  {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Step</div>
                <div className="flex items-center gap-1.5">
                  {autoStep ? (
                    <span className="flex items-center justify-center rounded-full bg-gray-800 text-white font-bold" style={{ fontSize: autoStep.length > 2 ? '8px' : '9px', minWidth: '18px', height: '18px', padding: '0 3px' }}>
                      {autoStep}
                    </span>
                  ) : null}
                  <span className="text-[11px] text-gray-500">
                    {d.stepOverride != null && d.stepOverride.trim() !== ''
                      ? 'override'
                      : autoStep
                      ? 'auto'
                      : '—'}
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Owner</div>
                <span className="text-[11px] font-medium text-gray-700">{d.owner || '—'}</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Confidence</div>
                <ConfidenceBar value={d.confidenceScore} />
              </div>
            </div>

            {/* Position on map */}
            <div className="bg-gray-50 rounded-lg p-2.5">
              <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Position on Map</div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">Automation</span>
                  <span className="font-semibold text-purple-600">{getAutomationLabel(d.automationLevel)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">Criticality / trust required</span>
                  <span className="font-semibold text-red-500">{Math.round(d.criticalityLevel * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {d.description && (
              <div>
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</div>
                <p className="text-xs text-gray-600 leading-relaxed">{d.description}</p>
              </div>
            )}
            {!d.description && (
              <div>
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</div>
                <p className="text-xs text-gray-300 italic">None — click Edit to add</p>
              </div>
            )}

            {/* Notes */}
            {d.notes && (
              <div>
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</div>
                <p className="text-xs text-gray-600 leading-relaxed">{d.notes}</p>
              </div>
            )}

            {/* Tags */}
            {d.tags.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <Tag size={10} /> Tags
                </div>
                <div className="flex flex-wrap gap-1">
                  {d.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Connections */}
            {connectedEdges.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Connections ({connectedEdges.length})
                </div>
                <div className="space-y-1">
                  {connectedEdges.map((edge) => {
                    const isSource = edge.source === node.id;
                    const otherId = isSource ? edge.target : edge.source;
                    const otherNode = nodes.find((n) => n.id === otherId);
                    return (
                      <div key={edge.id} className="flex items-center gap-2 text-[11px] text-gray-600 bg-gray-50 rounded-lg px-2.5 py-1.5">
                        <span className="text-gray-400">{isSource ? '→' : '←'}</span>
                        <span className="font-medium truncate">{otherNode?.data.title ?? otherId}</span>
                        <span className="ml-auto text-[9px] text-gray-400 bg-white border border-gray-200 rounded px-1.5 py-0.5 flex-shrink-0">
                          {edge.data?.relationshipType ?? ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </>
        )}
      </div>
    </div>
  );
}
