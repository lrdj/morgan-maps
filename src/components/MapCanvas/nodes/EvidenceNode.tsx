import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData } from '../../../types';
import { useMapStore } from '../../../store/mapStore';
import { NodeShell } from './NodeShell';

// Hexagon shape — evidence/data
const icon = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <polygon
      points="6,1 10.5,3.5 10.5,8.5 6,11 1.5,8.5 1.5,3.5"
      fill="#14b8a6"
    />
  </svg>
);

function EvidenceNode({ id, data }: NodeProps<NodeData>) {
  const selectNode = useMapStore((s) => s.selectNode);
  return (
    <>
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Right} id="right" />
      <NodeShell id={id} data={data} color="#14b8a6" icon={icon} onClick={() => selectNode(id)} />
    </>
  );
}

export default memo(EvidenceNode);
