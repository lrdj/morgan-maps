import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData } from '../../../types';
import { useMapStore } from '../../../store/mapStore';
import { NodeShell } from './NodeShell';

function SystemNode({ id, data }: NodeProps<NodeData>) {
  const selectNode = useMapStore((s) => s.selectNode);

  const icon = (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="1" width="10" height="8" rx="1.5" stroke="#8b5cf6" strokeWidth="1.5" fill="none" />
      <rect x="4" y="9" width="4" height="1.5" rx="0.5" fill="#8b5cf6" />
      <rect x="2" y="10" width="8" height="1" rx="0.5" fill="#8b5cf6" />
    </svg>
  );

  return (
    <>
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Bottom} id="bottom" />
      <Handle type="source" position={Position.Right} id="right" />
      <NodeShell
        id={id}
        data={data}
        color="#8b5cf6"
        icon={icon}
        onClick={() => selectNode(id)}
      />
    </>
  );
}

export default memo(SystemNode);
