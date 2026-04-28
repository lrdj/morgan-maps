import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData } from '../../../types';
import { useMapStore } from '../../../store/mapStore';
import { NodeShell } from './NodeShell';

// Circle — interface/touchpoint
const icon = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="4.5" fill="#3b82f6" />
  </svg>
);

function InterfaceNode({ id, data }: NodeProps<NodeData>) {
  const selectNode = useMapStore((s) => s.selectNode);
  return (
    <>
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Right} id="right" />
      <NodeShell id={id} data={data} color="#3b82f6" icon={icon} onClick={() => selectNode(id)} />
    </>
  );
}

export default memo(InterfaceNode);
