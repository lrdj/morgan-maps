import { useState } from 'react';
import { X } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { EdgeData, RelationshipType, RELATIONSHIP_LABELS } from '../../types';

interface CreateEdgeModalProps {
  onClose: () => void;
  editEdgeId?: string | null;
}

const DEFAULT_FORM: EdgeData = {
  relationshipType: 'informs',
  description: '',
  interoperabilityNote: '',
};

export function CreateEdgeModal({ onClose, editEdgeId }: CreateEdgeModalProps) {
  const edges = useMapStore((s) => s.edges);
  const nodes = useMapStore((s) => s.nodes);
  const updateEdge = useMapStore((s) => s.updateEdge);
  const deleteEdge = useMapStore((s) => s.deleteEdge);

  const existingEdge = editEdgeId ? edges.find((e) => e.id === editEdgeId) : null;
  const sourceNode = existingEdge ? nodes.find((n) => n.id === existingEdge.source) : null;
  const targetNode = existingEdge ? nodes.find((n) => n.id === existingEdge.target) : null;

  const [form, setForm] = useState<EdgeData>(
    existingEdge?.data ?? { ...DEFAULT_FORM }
  );

  const update = <K extends keyof EdgeData>(key: K, value: EdgeData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = () => {
    if (editEdgeId) {
      updateEdge(editEdgeId, form);
    }
    onClose();
  };

  const handleDelete = () => {
    if (editEdgeId) {
      deleteEdge(editEdgeId);
    }
    onClose();
  };

  const RELATIONSHIP_SHORT: Record<RelationshipType, string> = {
    informs:     'Provides information that shapes the other node\'s decision or action.',
    constrains:  'Sets rules or limits the other node must follow.',
    triggers:    'Causes the other node to start or activate.',
    transfersTo: 'Passes work or responsibility to the other node.',
    reviews:     'Checks or assures the other node\'s output.',
    escalatesTo: 'Passes work onward when more specialist or higher-level handling is needed.',
  };

  const RELATIONSHIP_LONG: Record<RelationshipType, string> = {
    informs:     'Provides information, evidence, or signals that shape the other node\'s decision or action.',
    constrains:  'Sets rules, limits, or conditions that the other node must operate within.',
    triggers:    'An event or completion here causes the other node to begin or activate.',
    transfersTo: 'Passes work, responsibility, ownership, or an actionable result to the other node.',
    reviews:     'Checks, verifies, audits, or quality-assures the other node\'s output or work.',
    escalatesTo: 'Passes work onward when thresholds, exceptions, or complexity require higher handling.',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-[480px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {editEdgeId ? 'Edit Relationship' : 'Create Relationship'}
            </h2>
            {existingEdge && sourceNode && targetNode && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                {sourceNode.data.title} → {targetNode.data.title}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-4 space-y-4">
          {/* Relationship type */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Relationship Type
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(RELATIONSHIP_LABELS) as RelationshipType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => update('relationshipType', type)}
                  title={RELATIONSHIP_LONG[type]}
                  className={`text-left px-3 py-2 rounded-lg border text-sm transition-all ${
                    form.relationshipType === type
                      ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-[12px]">{RELATIONSHIP_LABELS[type]}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">
                    {RELATIONSHIP_SHORT[type]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={2}
              placeholder="Describe this relationship"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <div>
            {editEdgeId && (
              <button
                onClick={handleDelete}
                className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {editEdgeId ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
