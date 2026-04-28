import { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  ControlButton,
  MiniMap,
  Connection,
  ReactFlowProvider,
  useReactFlow,
  MarkerType,
  BackgroundVariant,
  NodeDragHandler,
  ReactFlowInstance,
  NodeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useMapStore, getFilteredNodes } from '../../store/mapStore';
import { nodeTypes } from './nodes';
import { AxisBackground } from './AxisBackground';
import RelationshipEdge from './edges/RelationshipEdge';
import { EdgeData } from '../../types';
import { canvasToAxis } from '../../utils/coordinates';

const edgeTypes = {
  relationship: RelationshipEdge,
};

const defaultEdgeOptions = {
  type: 'relationship',
  markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
};

function MapCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [minimapVisible, setMinimapVisible] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);

  const rfInstance = useRef<ReactFlowInstance | null>(null);

  const canvasWidth = useMapStore((s) => s.canvasWidth);
  const canvasHeight = useMapStore((s) => s.canvasHeight);
  const gridLocked = useMapStore((s) => s.gridLocked);
  const nodesLocked = useMapStore((s) => s.nodesLocked);
  const toggleNodesLocked = useMapStore((s) => s.toggleNodesLocked);

  const onInit = useCallback(
    (instance: ReactFlowInstance) => {
      rfInstance.current = instance;
      instance.fitBounds(
        { x: -80, y: -35, width: canvasWidth + 160, height: canvasHeight + 70 },
        { padding: 0.04 }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Re-fit whenever the canvas size changes (e.g. after setCanvasSize)
  useEffect(() => {
    if (!rfInstance.current) return;
    rfInstance.current.fitBounds(
      { x: -80, y: -35, width: canvasWidth + 160, height: canvasHeight + 70 },
      { duration: 400, padding: 0.04 }
    );
  }, [canvasWidth, canvasHeight]);

  // Toolbar "Fit view" button
  const fitViewTrigger = useMapStore((s) => s.fitViewTrigger);
  useEffect(() => {
    if (fitViewTrigger > 0 && rfInstance.current) {
      rfInstance.current.fitView({ padding: 0.12, duration: 400 });
    }
  }, [fitViewTrigger]);

  const nodes = useMapStore((s) => s.nodes);
  const edges = useMapStore((s) => s.edges);
  const filters = useMapStore((s) => s.filters);
  const selectedNodeId = useMapStore((s) => s.selectedNodeId);
  const traceAncestors = useMapStore((s) => s.traceAncestors);
  const traceDescendants = useMapStore((s) => s.traceDescendants);
  const onNodesChange = useMapStore((s) => s.onNodesChange);
  const onEdgesChange = useMapStore((s) => s.onEdgesChange);
  const addEdge = useMapStore((s) => s.addEdge);
  const selectNode = useMapStore((s) => s.selectNode);
  const selectEdge = useMapStore((s) => s.selectEdge);
  const setActivePanel = useMapStore((s) => s.setActivePanel);
  const addNode = useMapStore((s) => s.addNode);
  const updateNodePosition = useMapStore((s) => s.updateNodePosition);

  const filteredNodes = getFilteredNodes(nodes, filters, selectedNodeId, traceAncestors, traceDescendants);
  const displayNodes = nodesLocked
    ? filteredNodes.map((n) => ({ ...n, draggable: false }))
    : filteredNodes;

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge = {
        ...connection,
        id: `edge_${Date.now()}`,
        type: 'relationship',
        data: {
          relationshipType: 'informs' as const,
          description: '',
          interoperabilityNote: '',
        } as EdgeData,
        markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
        source: connection.source ?? '',
        target: connection.target ?? '',
      };
      addEdge(newEdge);
    },
    [addEdge]
  );

  const onNodeDragStop: NodeDragHandler = useCallback(
    (_event, node) => {
      updateNodePosition(node.id, node.position.x, node.position.y);
    },
    [updateNodePosition]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (nodesLocked) {
        onNodesChange(changes.filter((c) => c.type !== 'position'));
      } else {
        onNodesChange(changes);
      }
    },
    [nodesLocked, onNodesChange]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
    selectEdge(null);
    setActivePanel('none');
  }, [selectNode, selectEdge, setActivePanel]);

  const onWrapperDoubleClick = useCallback(
    (event: React.MouseEvent) => {
      if (nodesLocked) return; // no new nodes while locked
      const target = event.target as HTMLElement;
      const isPaneClick =
        target.classList.contains('react-flow__pane') ||
        target.classList.contains('react-flow__renderer') ||
        target.classList.contains('react-flow__background');
      if (!isPaneClick) return;

      const pos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const { automation, criticality } = canvasToAxis(pos.x, pos.y, canvasWidth, canvasHeight);
      addNode({
        title: 'New Node',
        description: '',
        nodeType: 'execution',
        owner: '',
        organisation: '',
        tags: [],
        status: 'active',
        confidenceScore: 0.7,
        notes: '',
        automationLevel: automation,
        criticalityLevel: criticality,
        overlays: {},
      });
    },
    [screenToFlowPosition, addNode, canvasWidth, canvasHeight]
  );

  // When locked the user can zoom out much further to see the full canvas in context
  const minZoom = gridLocked ? 0.05 : 0.1;

  return (
    <div
      ref={reactFlowWrapper}
      className="w-full h-full"
      onDoubleClick={onWrapperDoubleClick}
    >
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={nodesLocked ? undefined : onNodeDragStop}
        onPaneClick={onPaneClick}
        onInit={onInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        minZoom={minZoom}
        maxZoom={2}
        attributionPosition="bottom-right"
        proOptions={{ hideAttribution: true }}
        nodesDraggable={!nodesLocked}
        nodesConnectable={!nodesLocked}
        elementsSelectable={true}
        selectionOnDrag={selectionMode}
        panOnDrag={selectionMode ? [1, 2] : true}
      >
        <AxisBackground canvasWidth={canvasWidth} canvasHeight={canvasHeight} />
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#e2e8f0" />
        <Controls
          position="bottom-right"
          showInteractive={false}
          showFitView={false}
        >
          {/* Selection box tool */}
          <ControlButton
            onClick={() => setSelectionMode((v) => !v)}
            title={selectionMode ? 'Back to pan mode' : 'Box select mode — drag to select multiple nodes'}
            style={selectionMode ? { background: '#3b82f6', color: '#fff', borderRadius: 4 } : undefined}
          >
            <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
              <rect x="1" y="1" width="13" height="13" rx="1" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 2"/>
            </svg>
          </ControlButton>

          {/* Lock / unlock nodes */}
          <ControlButton
            onClick={toggleNodesLocked}
            title={nodesLocked ? 'Unlock — allow editing' : 'Lock — prevent moving or connecting nodes'}
            style={nodesLocked ? { background: '#ef4444', color: '#fff', borderRadius: 4 } : undefined}
          >
            {nodesLocked ? (
              <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
                <rect x="2.5" y="6.5" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M5 6.5V4.5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <circle cx="7.5" cy="10.5" r="1" fill="currentColor"/>
              </svg>
            ) : (
              <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
                <rect x="2.5" y="6.5" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M5 6.5V4.5a2.5 2.5 0 015 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <circle cx="7.5" cy="10.5" r="1" fill="currentColor"/>
              </svg>
            )}
          </ControlButton>

          {/* Minimap toggle */}
          <ControlButton
            onClick={() => setMinimapVisible((v) => !v)}
            title={minimapVisible ? 'Hide overview map' : 'Show overview map'}
            style={{ color: minimapVisible ? '#6366f1' : undefined }}
          >
            <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12">
              <path d="M1 1h4v4H1V1zm0 9h4v4H1v-4zm9-9h4v4h-4V1zm0 9h4v4h-4v-4zM5.5 3.5h4M3.5 5.5v4M8.5 5.5v4M5.5 8.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </ControlButton>
        </Controls>
        {minimapVisible && (
          <MiniMap
            position="bottom-right"
            style={{
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              marginBottom: 148, // clears the controls stack
            }}
            nodeColor={(node) => {
              const typeColors: Record<string, string> = {
                decision: '#f59e0b',
                evidence: '#14b8a6',
                execution: '#7c3aed',
                interface: '#3b82f6',
              };
              return typeColors[node.type ?? ''] ?? '#94a3b8';
            }}
            maskColor="rgba(241,245,249,0.7)"
          />
        )}
      </ReactFlow>
    </div>
  );
}

export function MapCanvas() {
  return (
    <ReactFlowProvider>
      <MapCanvasInner />
    </ReactFlowProvider>
  );
}
