import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData } from '../../../types';
import { useMapStore } from '../../../store/mapStore';
import { NodeShell } from './NodeShell';

function DataNode({ id, data }: NodeProps<NodeData>) {
  const selectNode = useMapStore((s) => s.selectNode);

  const icon = (
    <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
      <ellipse cx="6" cy="3" rx="5" ry="2" stroke="#06b6d4" strokeWidth="1.2" fill="#06b6d422" />
      <path d="M1 3v7c0 1.1 2.24 2 5 2s5-.9 5-2V3" stroke="#06b6d4" strokeWidth="1.2" fill="none" />
      <path d="M1 6.5c0 1.1 2.24 2 5 2s5-.9 5-2" stroke="#06b6d4" strokeWidth="1" fill="none" strokeDasharray="2 1" />
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
        color="#06b6d4"
        icon={icon}
        onClick={() => selectNode(id)}
      />
    </>
  );
}

export default memo(DataNode);
