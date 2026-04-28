import { useViewport } from 'reactflow';

const X_LABELS = [
  'Human-led',
  'Assisted',
  'Part-automated',
  'Conditionally automated',
  'Fully automated',
];

const Y_LABELS = ['Critical', 'High-Impact', 'Important', 'Operational', 'Routine'];

interface AxisBackgroundProps {
  canvasWidth: number;
  canvasHeight: number;
}

export function AxisBackground({ canvasWidth, canvasHeight }: AxisBackgroundProps) {
  const { x, y, zoom } = useViewport();

  const xDivW = canvasWidth / 5;
  const yDivH = canvasHeight / 5;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      <svg
        style={{
          transform: `translate(${x}px, ${y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          overflow: 'visible',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
        width={canvasWidth}
        height={canvasHeight}
      >
        {/* X vertical separator lines */}
        {[1, 2, 3, 4].map((i) => (
          <line
            key={`xsep-${i}`}
            x1={i * xDivW}
            y1={0}
            x2={i * xDivW}
            y2={canvasHeight}
            stroke="rgba(0,0,0,0.07)"
            strokeWidth={1}
            strokeDasharray="5 5"
          />
        ))}

        {/* Y horizontal separator lines */}
        {[1, 2, 3, 4].map((i) => (
          <line
            key={`ysep-${i}`}
            x1={0}
            y1={i * yDivH}
            x2={canvasWidth}
            y2={i * yDivH}
            stroke="rgba(0,0,0,0.07)"
            strokeWidth={1}
            strokeDasharray="5 5"
          />
        ))}

        {/* Canvas border */}
        <rect
          x={0}
          y={0}
          width={canvasWidth}
          height={canvasHeight}
          fill="none"
          stroke="rgba(0,0,0,0.12)"
          strokeWidth={1}
        />

        {/* ── X axis ── */}

        {/* Band labels */}
        {X_LABELS.map((label, i) => (
          <text
            key={label}
            x={i * xDivW + xDivW / 2}
            y={canvasHeight - 10}
            fill="rgba(0,0,0,0.15)"
            fontSize={8.5}
            textAnchor="middle"
            fontFamily="system-ui, sans-serif"
            fontWeight="500"
          >
            {label.toUpperCase()}
          </text>
        ))}

        {/* Axis title: AUTOMATION — outside bottom border */}
        <text
          x={canvasWidth / 2}
          y={canvasHeight + 18}
          fill="rgba(0,0,0,0.3)"
          fontSize={10}
          fontWeight="700"
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.08em"
        >
          AUTOMATION
          <title>How far an element can be handled by software or machines rather than human effort.</title>
        </text>


        {/* ── Y axis ── */}

        {/* Axis title: CRITICALITY — outside left border */}
        <text
          x={-canvasHeight / 2}
          y={-18}
          fill="rgba(0,0,0,0.3)"
          fontSize={10}
          fontWeight="700"
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.08em"
          transform={`rotate(-90)`}
        >
          CRITICALITY
          <title>How much an element matters to getting the decision right and sustaining trust in the outcome.</title>
        </text>

        {/* Row band labels */}
        {Y_LABELS.map((label, i) => (
          <text
            key={label}
            x={20}
            y={i * yDivH + yDivH / 2}
            fill="rgba(0,0,0,0.15)"
            fontSize={8.5}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="system-ui, sans-serif"
            fontWeight="500"
            transform={`rotate(-90 20 ${i * yDivH + yDivH / 2})`}
          >
            {label.toUpperCase()}
          </text>
        ))}

      </svg>
    </div>
  );
}
