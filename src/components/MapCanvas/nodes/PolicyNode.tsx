import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData } from '../../../types';
import { useMapStore } from '../../../store/mapStore';
import { NodeShell } from './NodeShell';

function PolicyNode({ id, data }: NodeProps<NodeData>) {
  const selectNode = useMapStore((s) => s.selectNode);

  const icon = (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
      <rect x="1" y="1" width="9" height="11" rx="1.5" fill="#ef4444" opacity="0.2" />
      <rect x="1" y="1" width="9" height="11" rx="1.5" stroke="#ef4444" strokeWidth="1.2" />
      <line x1="3" y1="4" x2="8" y2="4" stroke="#ef4444" strokeWidth="1" />
      <line x1="3" y1="6.5" x2="8" y2="6.5" stroke="#ef4444" strokeWidth="1" />
      <line x1="3" y1="9" x2="6" y2="9" stroke="#ef4444" strokeWidth="1" />
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
        color="#ef4444"
        icon={icon}
        onClick={() => selectNode(id)}
      />
    </>
  );
}

export default memo(PolicyNode);
