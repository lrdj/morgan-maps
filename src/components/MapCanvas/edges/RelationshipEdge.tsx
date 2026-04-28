import { memo } from 'react';
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  Position,
} from 'reactflow';
import { EdgeData, RelationshipType } from '../../../types';
import { useMapStore } from '../../../store/mapStore';

interface EdgeStyle {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
}

const EDGE_STYLES: Record<RelationshipType, EdgeStyle> = {
  informs:     { stroke: '#94a3b8', strokeWidth: 1.5 },
  constrains:  { stroke: '#f43f5e', strokeWidth: 2, strokeDasharray: '6 3' },
  triggers:    { stroke: '#3b82f6', strokeWidth: 2 },
  transfersTo: { stroke: '#10b981', strokeWidth: 2, strokeDasharray: '5 3' },
  reviews:     { stroke: '#f59e0b', strokeWidth: 1.5, strokeDasharray: '2 2' },
  escalatesTo: { stroke: '#f97316', strokeWidth: 3 },
};

const SHORT_LABELS: Record<RelationshipType, string> = {
  informs:     'informs',
  constrains:  'constrains',
  triggers:    'triggers',
  transfersTo: 'transfers to',
  reviews:     'reviews',
  escalatesTo: 'escalates',
};

// Node dimensions from NodeShell (w-40 = 160px, h-[70px] = 70px)
const NODE_W = 160;
const NODE_H = 70;

/**
 * Compute the optimal attachment point on a node's border for an edge
 * connecting to `otherCenter`. Returns the point on the border and the
 * outgoing Position (for bezier handle direction).
 */
function getBorderAttachment(
  nodeX: number,
  nodeY: number,
  nodeW: number,
  nodeH: number,
  otherCenter: { x: number; y: number }
): { x: number; y: number; position: Position } {
  const cx = nodeX + nodeW / 2;
  const cy = nodeY + nodeH / 2;
  const dx = otherCenter.x - cx;
  const dy = otherCenter.y - cy;
  const hw = nodeW / 2;
  const hh = nodeH / 2;

  if (dx === 0 && dy === 0) {
    return { x: cx, y: nodeY + nodeH, position: Position.Bottom };
  }

  // Scale factor to reach each face
  const tx = dx !== 0 ? Math.abs(hw / dx) : Infinity;
  const ty = dy !== 0 ? Math.abs(hh / dy) : Infinity;

  if (tx <= ty) {
    // Hits left or right face
    if (dx > 0) {
      return { x: cx + hw, y: cy + dy * tx, position: Position.Right };
    } else {
      return { x: cx - hw, y: cy + dy * tx, position: Position.Left };
    }
  } else {
    // Hits top or bottom face
    if (dy > 0) {
      return { x: cx + dx * ty, y: cy + hh, position: Position.Bottom };
    } else {
      return { x: cx + dx * ty, y: cy - hh, position: Position.Top };
    }
  }
}

function RelationshipEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<EdgeData>) {
  const selectEdge = useMapStore((s) => s.selectEdge);
  const selectedEdgeId = useMapStore((s) => s.selectedEdgeId);
  const nodes = useMapStore((s) => s.nodes);
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const traceAncestors = useMapStore((s) => s.traceAncestors);
  const traceDescendants = useMapStore((s) => s.traceDescendants);

  const relType: RelationshipType = data?.relationshipType ?? 'informs';
  const style = EDGE_STYLES[relType];
  const isSelected = selectedEdgeId === id;

  // Trace fading: fade edges not on the selected node's path
  const tracingActive = !!selectedNodeId;
  const pathNodeIds = new Set([selectedNodeId, ...traceAncestors, ...traceDescendants]);
  const isOnPath = !tracingActive || (pathNodeIds.has(source) && pathNodeIds.has(target));
  const edgeOpacity = tracingActive && !isOnPath ? 0.08 : 1;

  // Find source and target nodes to compute floating attachment points
  const sourceNode = nodes.find((n) => n.id === source);
  const targetNode = nodes.find((n) => n.id === target);

  let sx = sourceX, sy = sourceY, sp = sourcePosition;
  let tx = targetX, ty = targetY, tp = targetPosition;

  if (sourceNode && targetNode) {
    const sw = sourceNode.width ?? NODE_W;
    const sh = sourceNode.height ?? NODE_H;
    const tw = targetNode.width ?? NODE_W;
    const th = targetNode.height ?? NODE_H;

    const targetCenter = {
      x: targetNode.position.x + tw / 2,
      y: targetNode.position.y + th / 2,
    };
    const sourceCenter = {
      x: sourceNode.position.x + sw / 2,
      y: sourceNode.position.y + sh / 2,
    };

    const srcAttach = getBorderAttachment(sourceNode.position.x, sourceNode.position.y, sw, sh, targetCenter);
    const tgtAttach = getBorderAttachment(targetNode.position.x, targetNode.position.y, tw, th, sourceCenter);

    sx = srcAttach.x; sy = srcAttach.y; sp = srcAttach.position;
    tx = tgtAttach.x; ty = tgtAttach.y; tp = tgtAttach.position;
  }

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sp,
    targetX: tx,
    targetY: ty,
    targetPosition: tp,
  });

  const edgeStyle = {
    stroke: style.stroke,
    strokeWidth: isSelected ? style.strokeWidth + 1 : style.strokeWidth,
    strokeDasharray: style.strokeDasharray,
    opacity: edgeOpacity,
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={edgeStyle}
        interactionWidth={12}
      />
      <g onClick={() => selectEdge(id)} style={{ cursor: 'pointer' }}>
        <path d={edgePath} fill="none" strokeWidth={12} stroke="transparent" />
      </g>
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            cursor: 'pointer',
            opacity: edgeOpacity,
          }}
          className="nodrag nopan"
          onClick={() => selectEdge(id)}
        >
          <span
            className="px-1 py-0.5 rounded text-[9px] font-medium"
            style={{
              backgroundColor: `${style.stroke}18`,
              color: style.stroke,
              border: `1px solid ${style.stroke}40`,
            }}
          >
            {SHORT_LABELS[relType]}
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(RelationshipEdge);
