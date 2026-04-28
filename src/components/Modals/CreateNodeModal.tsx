import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { computeStepNumbers } from '../../utils/stepNumbers';
import {
  NodeData,
  NodeType,
  Status,
  NODE_TYPE_LABELS,
  AUTOMATION_LABELS,
  CRITICALITY_LABELS,
} from '../../types';

interface CreateNodeModalProps {
  onClose: () => void;
  editNodeId?: string | null;
}

function getAutomationLabel(value: number): string {
  let closest = AUTOMATION_LABELS[0];
  let minDist = Math.abs(value - closest.value);
  for (const al of AUTOMATION_LABELS) {
    const dist = Math.abs(value - al.value);
    if (dist < minDist) {
      minDist = dist;
      closest = al;
    }
  }
  return closest.label;
}

function getCriticalityLabel(value: number): string {
  let closest = CRITICALITY_LABELS[0];
  let minDist = Math.abs(value - closest.value);
  for (const cl of CRITICALITY_LABELS) {
    const dist = Math.abs(value - cl.value);
    if (dist < minDist) {
      minDist = dist;
      closest = cl;
    }
  }
  return closest.label;
}

const DEFAULT_FORM: Omit<NodeData, 'selected' | 'overlays'> = {
  title: '',
  description: '',
  nodeType: 'execution',
  owner: '',
  organisation: '',
  tags: [],
  status: 'active',
  confidenceScore: 0.7,
  notes: '',
  automationLevel: 0.5,
  criticalityLevel: 0.5,
  stepOverride: null,
};

export function CreateNodeModal({ onClose, editNodeId }: CreateNodeModalProps) {
  const nodes = useMapStore((s) => s.nodes);
  const edges = useMapStore((s) => s.edges);
  const addNode = useMapStore((s) => s.addNode);
  const updateNode = useMapStore((s) => s.updateNode);
  const stepNumbers = useMemo(() => computeStepNumbers(nodes, edges), [nodes, edges]);
  const autoStep = editNodeId ? stepNumbers[editNodeId] : undefined;

  const existingNode = editNodeId ? nodes.find((n) => n.id === editNodeId) : null;

  const [form, setForm] = useState<typeof DEFAULT_FORM>(
    existingNode
      ? {
          title: existingNode.data.title,
          description: existingNode.data.description,
          nodeType: existingNode.data.nodeType,
          owner: existingNode.data.owner,
          organisation: existingNode.data.organisation,
          tags: existingNode.data.tags,
          status: existingNode.data.status,
          confidenceScore: existingNode.data.confidenceScore,
          notes: existingNode.data.notes,
          automationLevel: existingNode.data.automationLevel,
          criticalityLevel: existingNode.data.criticalityLevel,
          stepOverride: existingNode.data.stepOverride ?? null,
        }
      : { ...DEFAULT_FORM }
  );

  const [tagInput, setTagInput] = useState('');

  const update = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const addTag = (raw: string) => {
    raw.split(',').forEach((t) => {
      const trimmed = t.trim();
      if (trimmed && !form.tags.includes(trimmed)) {
        setForm((f) => ({ ...f, tags: [...f.tags, trimmed] }));
      }
    });
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    if (editNodeId) {
      updateNode(editNodeId, { ...form, overlays: existingNode?.data.overlays ?? {} });
    } else {
      addNode({ ...form, overlays: {} });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-[520px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {editNodeId ? 'Edit Node' : 'Create Node'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Node title"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </div>

          {/* Step number override */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                Step number
              </label>
              {autoStep && (
                <span className="text-[10px] text-gray-400">
                  Auto: <span className="font-semibold text-gray-600">{autoStep}</span>
                </span>
              )}
            </div>
            <input
              type="text"
              value={form.stepOverride ?? ''}
              onChange={(e) => update('stepOverride', e.target.value || null)}
              placeholder={autoStep ? `Auto (${autoStep}) — type to override, clear to restore` : 'e.g. 1, 2a, 3 — leave blank for auto'}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Leave blank to auto-derive from flow edges. Set to a space to suppress the number entirely.
            </p>
          </div>

          {/* Node type + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Node Type</label>
              <select
                value={form.nodeType}
                onChange={(e) => update('nodeType', e.target.value as NodeType)}
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
                value={form.status}
                onChange={(e) => update('status', e.target.value as Status)}
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
                type="text"
                value={form.organisation}
                onChange={(e) => update('organisation', e.target.value)}
                placeholder="e.g. DWP, HMRC"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Owner</label>
              <input
                type="text"
                value={form.owner}
                onChange={(e) => update('owner', e.target.value)}
                placeholder="Team or person"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={2}
              placeholder="What does this node do?"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </div>

          {/* Automation Level */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="font-semibold text-gray-500 uppercase tracking-wide">Automation</span>
              <span className="font-medium text-purple-600">
                {getAutomationLabel(form.automationLevel)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={4}
              step={1}
              value={Math.round(form.automationLevel * 4)}
              onChange={(e) => update('automationLevel', Number(e.target.value) / 4)}
              className="w-full h-2 accent-purple-500"
            />
            <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
              <span>Human-led</span>
              <span>Fully automated</span>
            </div>
          </div>

          {/* Criticality Level */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="font-semibold text-gray-500 uppercase tracking-wide">Criticality</span>
              <span className="font-medium text-red-500">
                {Math.round(form.criticalityLevel * 100)}% — {getCriticalityLabel(form.criticalityLevel)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(form.criticalityLevel * 100)}
              onChange={(e) => update('criticalityLevel', Number(e.target.value) / 100)}
              className="w-full h-2 accent-red-400"
            />
            <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
              <span>Low trust needed</span>
              <span>High trust needed</span>
            </div>
          </div>

          {/* Confidence Score */}
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="font-semibold text-gray-500 uppercase tracking-wide">Mapping confidence</span>
              <span className="font-medium text-blue-600">{Math.round(form.confidenceScore * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(form.confidenceScore * 100)}
              onChange={(e) => update('confidenceScore', Number(e.target.value) / 100)}
              className="w-full h-2 accent-blue-500"
            />
            <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
              <span>Tentative</span>
              <span>High confidence</span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Tags</label>
            <div className="flex flex-wrap gap-1 mb-1.5">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-medium"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-400">×</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tags (comma-separated or press Enter)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={2}
              placeholder="Internal notes or observations"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.title.trim()}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {editNodeId ? 'Save Changes' : 'Create Node'}
          </button>
        </div>
      </div>
    </div>
  );
}
