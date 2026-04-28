import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData } from '../../../types';
import { useMapStore } from '../../../store/mapStore';
import { NodeShell } from './NodeShell';

function CaseObjectNode({ id, data }: NodeProps<NodeData>) {
  const selectNode = useMapStore((s) => s.selectNode);

  const icon = (
    <svg width="13" height="12" viewBox="0 0 13 12" fill="none">
      <path d="M1 3.5C1 2.67 1.67 2 2.5 2H5l1.5 2H10.5C11.33 4 12 4.67 12 5.5V9.5C12 10.33 11.33 11 10.5 11H2.5C1.67 11 1 10.33 1 9.5V3.5Z" fill="#f9731622" stroke="#f97316" strokeWidth="1.2" />
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
        color="#f97316"
        icon={icon}
        onClick={() => selectNode(id)}
      />
    </>
  );
}

export default memo(CaseObjectNode);
