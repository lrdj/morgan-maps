import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData } from '../../../types';
import { useMapStore } from '../../../store/mapStore';
import { NodeShell } from './NodeShell';

function SharedCapabilityNode({ id, data }: NodeProps<NodeData>) {
  const selectNode = useMapStore((s) => s.selectNode);

  // Hexagon icon
  const icon = (
    <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
      <polygon
        points="6.5,1 11.5,4 11.5,8 6.5,11 1.5,8 1.5,4"
        fill="#ec489922"
        stroke="#ec4899"
        strokeWidth="1.2"
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
        color="#ec4899"
        icon={icon}
        onClick={() => selectNode(id)}
      />
    </>
  );
}

export default memo(SharedCapabilityNode);
