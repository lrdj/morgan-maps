import { ReactNode, useMemo } from 'react';
import { NodeData, OverlayType } from '../../../types';
import { useMapStore } from '../../../store/mapStore';
import { NODE_TYPE_LABELS } from '../../../types';
import { computeStepNumbers } from '../../../utils/stepNumbers';

interface NodeShellProps {
  id: string;
  data: NodeData;
  color: string;
  icon: ReactNode;
  onClick: () => void;
}

const OVERLAY_STYLES: Partial<Record<OverlayType, string>> = {
  orgBoundaries:    'ring-2 ring-purple-400 ring-offset-1 ring-dashed',
  pathway:          'bg-yellow-50',
  frictionPoints:   '',   // handled via dot indicator below
  policyConstraints:'border-t-4 border-t-pink-500',
  dataQuality:      '',   // handled via hatching below
};

export function NodeShell({ id, data, color, icon, onClick }: NodeShellProps) {
  const overlays = useMapStore((s) => s.overlays);
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const traceAncestors = useMapStore((s) => s.traceAncestors);
  const traceDescendants = useMapStore((s) => s.traceDescendants);
  const showStepNumbers = useMapStore((s) => s.showStepNumbers);
  const nodes = useMapStore((s) => s.nodes);
  const edges = useMapStore((s) => s.edges);
  const stepNumbers = useMemo(() => computeStepNumbers(nodes, edges), [nodes, edges]);
  const stepLabel = showStepNumbers ? stepNumbers[id] : undefined;

  const isAncestor = selectedNodeId ? traceAncestors.includes(id) : false;
  const isDescendant = selectedNodeId ? traceDescendants.includes(id) : false;

  const activeOverlayClasses = (Object.keys(overlays) as OverlayType[])
    .filter((k) => overlays[k] && data.overlays[k])
    .map((k) => OVERLAY_STYLES[k] ?? '')
    .filter(Boolean)
    .join(' ');

  const isSelected   = data.selected;
  const isPlanned    = data.status === 'planned';
  const isDeprecated = data.status === 'deprecated';

  const showFrictionPoint = overlays.frictionPoints && data.overlays.frictionPoints;
  const showDataQuality   = overlays.dataQuality    && data.overlays.dataQuality;

  // Trace ring: ancestor = indigo, descendant = emerald
  const traceRing = isAncestor
    ? '0 0 0 3px #6366f1'
    : isDescendant
    ? '0 0 0 3px #10b981'
    : undefined;

  return (
    <div
      onClick={onClick}
      className={`
        relative flex flex-col justify-between
        bg-white rounded-md shadow-sm
        w-40 h-[70px] px-2 py-1.5
        transition-all duration-150
        ${isDeprecated ? 'opacity-50' : ''}
        ${activeOverlayClasses}
      `}
      style={{
        border: isSelected
          ? `3px solid ${color}`
          : isPlanned
          ? `2px dashed ${color}`
          : `2px solid ${color}`,
        boxShadow: traceRing,
        backgroundImage: showDataQuality
          ? 'repeating-linear-gradient(45deg, #f8fafc 0px, #f8fafc 4px, #e2e8f0 4px, #e2e8f0 8px)'
          : undefined,
      }}
    >
      {/* Top row: type badge + indicators */}
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-1 rounded px-1 py-0.5"
          style={{ backgroundColor: `${color}22` }}
        >
          {icon}
          <span
            className="text-[9px] font-semibold uppercase tracking-wide leading-none"
            style={{ color }}
          >
            {NODE_TYPE_LABELS[data.nodeType]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {stepLabel && (
            <span
              className="flex items-center justify-center rounded-full bg-gray-800 text-white font-bold leading-none flex-shrink-0"
              style={{ fontSize: stepLabel.length > 2 ? '7px' : '8px', minWidth: '16px', height: '16px', padding: '0 3px' }}
              title={`Step ${stepLabel}`}
            >
              {stepLabel}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <p className="text-[11px] font-semibold text-gray-800 leading-tight line-clamp-2 mt-0.5">
          {data.title}
        </p>
      </div>

      {/* Organisation */}
      <p className="text-[9px] text-gray-400 leading-none truncate mt-0.5">
        {data.organisation}
      </p>

      {/* Friction point indicator */}
      {showFrictionPoint && (
        <span
          className="absolute bottom-1 left-1 w-2 h-2 rounded-full bg-red-400"
          title="Friction point"
        />
      )}
    </div>
  );
}
