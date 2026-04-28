import { Map, Plus, BookOpen } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { SEED_NODES, SEED_EDGES } from '../../data/seedData';

interface WelcomeModalProps {
  onDismiss: () => void;
}

export function WelcomeModal({ onDismiss }: WelcomeModalProps) {
  const importMap = useMapStore((s) => s.importMap);
  const setMapName = useMapStore((s) => s.setMapName);

  const handleLoadExample = () => {
    importMap({
      nodes: SEED_NODES,
      edges: SEED_EDGES,
    });
    setMapName('Universal Credit Claim Journey');
    onDismiss();
  };

  const handleStartBlank = () => {
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <Map size={22} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Morgan Map</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            A decision-centred way of mapping services — plotting elements by how automatable they are and how critical they are to good outcomes and trust.
          </p>
        </div>

        {/* Options */}
        <div className="px-8 pb-8 flex flex-col gap-3">
          <button
            onClick={handleLoadExample}
            className="group w-full flex items-start gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center flex-shrink-0 transition-colors">
              <BookOpen size={16} className="text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-0.5">Load example map</div>
              <div className="text-xs text-gray-500 leading-snug">Universal Credit Claim Journey — a worked example showing decisions, evidence, execution, and interfaces across a complex government service.</div>
            </div>
          </button>

          <button
            onClick={handleStartBlank}
            className="group w-full flex items-start gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors">
              <Plus size={16} className="text-gray-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800 mb-0.5">Start blank</div>
              <div className="text-xs text-gray-500 leading-snug">Begin with an empty canvas. Add nodes, connect them, and build your own map from scratch.</div>
            </div>
          </button>

          <p className="text-center text-[11px] text-gray-400 pt-1">
            You can import a JSON file at any time via <span className="font-medium">File → Import</span>
          </p>
        </div>
      </div>
    </div>
  );
}
