import { useState } from 'react';
import { useMapStore } from './store/mapStore';
import { WelcomeModal } from './components/Modals/WelcomeModal';
import { MapCanvas } from './components/MapCanvas';
import { MainToolbar } from './components/Toolbar/MainToolbar';
import { NodeDetailPanel } from './components/Panel/NodeDetailPanel';
import { ViewsPanel } from './components/Panel/ViewsPanel';
import { HelpPanel } from './components/Panel/HelpPanel';
// import { RiskInsightsPanel } from './components/Panel/RiskInsightsPanel';
import { CreateNodeModal } from './components/Modals/CreateNodeModal';
import { CreateEdgeModal } from './components/Modals/CreateEdgeModal';

// ---------------------------------------------------------------------------
// Root application component
// ---------------------------------------------------------------------------
export default function App() {
  const [showCreateNodeModal, setShowCreateNodeModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  const activePanel = useMapStore((s) => s.activePanel);
  const selectedEdgeId = useMapStore((s) => s.selectedEdgeId);
  const setActivePanel = useMapStore((s) => s.setActivePanel);
  const triggerFitView = useMapStore((s) => s.triggerFitView);

  // The right-rail panels (node detail, risk insights, views) live here.
  const showRightPanel =
    activePanel === 'node' ||
    activePanel === 'risks' ||
    activePanel === 'views' ||
    activePanel === 'help';

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* ── Top toolbar ──────────────────────────────────────────────── */}
      <MainToolbar
        onAddNode={() => setShowCreateNodeModal(true)}
        onFitView={triggerFitView}
      />

      {/* ── Main workspace ───────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Centre: map canvas */}
        <div className="flex-1 relative min-w-0">
          <MapCanvas />
        </div>

        {/* Right rail: detail panels */}
        {showRightPanel && (
          <div className="flex-shrink-0 h-full overflow-hidden">
            {activePanel === 'node' && <NodeDetailPanel />}
            {activePanel === 'views' && <ViewsPanel />}
            {activePanel === 'help' && <HelpPanel />}
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────── */}

      {showWelcome && <WelcomeModal onDismiss={() => setShowWelcome(false)} />}

      {/* Create / edit node */}
      {showCreateNodeModal && (
        <CreateNodeModal onClose={() => setShowCreateNodeModal(false)} />
      )}

      {/* Edit relationship — opens when user clicks an edge */}
      {activePanel === 'edge' && selectedEdgeId && (
        <CreateEdgeModal
          onClose={() => setActivePanel('none')}
          editEdgeId={selectedEdgeId}
        />
      )}
    </div>
  );
}
