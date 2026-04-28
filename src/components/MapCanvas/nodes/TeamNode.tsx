import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData } from '../../../types';
import { useMapStore } from '../../../store/mapStore';
import { NodeShell } from './NodeShell';

function TeamNode({ id, data }: NodeProps<NodeData>) {
  const selectNode = useMapStore((s) => s.selectNode);

  const icon = (
    <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
      <circle cx="4" cy="4" r="2.5" fill="#10b981" />
      <circle cx="9" cy="4" r="2" fill="#10b981" opacity="0.7" />
      <path d="M0.5 11c0-2.5 1.6-4 3.5-4s3.5 1.5 3.5 4" stroke="#10b981" strokeWidth="1.2" fill="none" />
      <path d="M7 9.5c.5-.8 1.2-1.5 2-1.5s2 .7 2.5 1.5" stroke="#10b981" strokeWidth="1.2" fill="none" opacity="0.7" />
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
        color="#10b981"
        icon={icon}
        onClick={() => selectNode(id)}
      />
    </>
  );
}

export default memo(TeamNode);
