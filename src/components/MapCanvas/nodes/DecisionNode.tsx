import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData } from '../../../types';
import { useMapStore } from '../../../store/mapStore';
import { NodeShell } from './NodeShell';

function DecisionNode({ id, data }: NodeProps<NodeData>) {
  const selectNode = useMapStore((s) => s.selectNode);

  const icon = (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect
        x="7"
        y="1"
        width="8"
        height="8"
        transform="rotate(45 7 7)"
        fill="#f59e0b"
        rx="1"
      />
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
        color="#f59e0b"
        icon={icon}
        onClick={() => selectNode(id)}
      />
    </>
  );
}

export default memo(DecisionNode);
