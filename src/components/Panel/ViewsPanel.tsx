import { X, SlidersHorizontal } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { NodeType, NODE_TYPE_LABELS } from '../../types';
import { ListOrdered } from 'lucide-react';

// ---------------------------------------------------------------------------
// Overlay code kept for future use — not currently exposed in the UI
// ---------------------------------------------------------------------------
// import { OverlayType } from '../../types';
// const OVERLAY_META: Record<OverlayType, { label: string; description: string }> = { ... }

const ALL_NODE_TYPES = Object.keys(NODE_TYPE_LABELS) as NodeType[];

export function ViewsPanel() {
  const setActivePanel = useMapStore((s) => s.setActivePanel);
  const filters = useMapStore((s) => s.filters);
  const setFilters = useMapStore((s) => s.setFilters);
  const resetFilters = useMapStore((s) => s.resetFilters);
  const nodes = useMapStore((s) => s.nodes);
  const showStepNumbers = useMapStore((s) => s.showStepNumbers);
  const toggleShowStepNumbers = useMapStore((s) => s.toggleShowStepNumbers);

  const allOrgs = [...new Set(nodes.map((n) => n.data.organisation).filter(Boolean))].sort();
  const allTags = [...new Set(nodes.flatMap((n) => n.data.tags))].sort();

  const hasActiveFilters =
    filters.nodeTypes.length > 0 ||
    filters.organisations.length > 0 ||
    filters.tags.length > 0 ||
    filters.criticalityRange[0] > 0 ||
    filters.criticalityRange[1] < 1 ||
    filters.automationRange[0] > 0 ||
    filters.automationRange[1] < 1;

  const toggleNodeType = (type: NodeType) => {
    const current = filters.nodeTypes;
    setFilters({
      nodeTypes: current.includes(type) ? current.filter((t) => t !== type) : [...current, type],
    });
  };

  const toggleOrg = (org: string) => {
    const current = filters.organisations;
    setFilters({
      organisations: current.includes(org) ? current.filter((o) => o !== org) : [...current, org],
    });
  };

  const toggleTag = (tag: string) => {
    const current = filters.tags;
    setFilters({
      tags: current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    });
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200 w-[300px] flex-shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} className="text-blue-500" />
          <h2 className="text-sm font-semibold text-gray-800">Filters</h2>
          {hasActiveFilters && (
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-semibold">
              on
            </span>
          )}
        </div>
        <button
          onClick={() => setActivePanel('none')}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <button
          onClick={resetFilters}
          disabled={!hasActiveFilters}
          className={`w-full text-[11px] rounded-lg py-1.5 transition-colors border ${
            hasActiveFilters
              ? 'text-red-500 hover:text-red-700 border-red-200 hover:border-red-300'
              : 'text-gray-300 border-gray-100 cursor-default'
          }`}
        >
          Reset all filters
        </button>

        {/* Display options */}
        <div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Display</div>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={showStepNumbers}
              onChange={toggleShowStepNumbers}
              className="w-3.5 h-3.5 accent-blue-500 rounded"
            />
            <ListOrdered size={12} className="text-gray-500" />
            <span className="text-xs text-gray-700 group-hover:text-gray-900">Show step numbers</span>
          </label>
        </div>

        {/* Node types */}
        <div>
          <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Node Types</div>
          <div className="grid grid-cols-2 gap-1">
            {ALL_NODE_TYPES.map((type) => (
              <label key={type} className="flex items-center gap-1.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.nodeTypes.includes(type)}
                  onChange={() => toggleNodeType(type)}
                  className="w-3 h-3 accent-blue-500"
                />
                <span className="text-[11px] text-gray-700 group-hover:text-gray-900">{NODE_TYPE_LABELS[type]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Criticality range */}
        <div>
          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span className="font-semibold uppercase tracking-wide">Criticality Range</span>
            <span>{Math.round(filters.criticalityRange[0] * 100)}% – {Math.round(filters.criticalityRange[1] * 100)}%</span>
          </div>
          <div className="space-y-1">
            {(['min', 'max'] as const).map((bound) => (
              <div key={bound} className="flex items-center gap-2">
                <span className="text-[9px] text-gray-400 w-6 capitalize">{bound}</span>
                <input
                  type="range" min={0} max={100}
                  value={Math.round(filters.criticalityRange[bound === 'min' ? 0 : 1] * 100)}
                  onChange={(e) => {
                    const val = Number(e.target.value) / 100;
                    const [lo, hi] = filters.criticalityRange;
                    if (bound === 'min' && val <= hi) setFilters({ criticalityRange: [val, hi] });
                    if (bound === 'max' && val >= lo) setFilters({ criticalityRange: [lo, val] });
                  }}
                  className="flex-1 h-1.5 accent-red-400"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Automation range */}
        <div>
          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span className="font-semibold uppercase tracking-wide">Automation Range</span>
            <span>{Math.round(filters.automationRange[0] * 100)}% – {Math.round(filters.automationRange[1] * 100)}%</span>
          </div>
          <div className="space-y-1">
            {(['min', 'max'] as const).map((bound) => (
              <div key={bound} className="flex items-center gap-2">
                <span className="text-[9px] text-gray-400 w-6 capitalize">{bound}</span>
                <input
                  type="range" min={0} max={100}
                  value={Math.round(filters.automationRange[bound === 'min' ? 0 : 1] * 100)}
                  onChange={(e) => {
                    const val = Number(e.target.value) / 100;
                    const [lo, hi] = filters.automationRange;
                    if (bound === 'min' && val <= hi) setFilters({ automationRange: [val, hi] });
                    if (bound === 'max' && val >= lo) setFilters({ automationRange: [lo, val] });
                  }}
                  className="flex-1 h-1.5 accent-purple-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Organisations */}
        {allOrgs.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Organisations</div>
            <div className="space-y-1">
              {allOrgs.map((org) => (
                <label key={org} className="flex items-center gap-1.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={filters.organisations.includes(org)}
                    onChange={() => toggleOrg(org)}
                    className="w-3 h-3 accent-blue-500"
                  />
                  <span className="text-[11px] text-gray-700 group-hover:text-gray-900">{org}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {allTags.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Tags</div>
            <div className="flex flex-wrap gap-1">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                    filters.tags.includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
