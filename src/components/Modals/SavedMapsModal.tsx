import { useState, useEffect } from 'react';
import { X, FolderOpen, Trash2, Clock, Database, BookOpen, Star } from 'lucide-react';
import { listSavedMaps, deleteSavedMap, formatSavedAt, SavedMap } from '../../utils/localSaves';
import { useMapStore } from '../../store/mapStore';
import { SEED_NODES, SEED_EDGES } from '../../data/seedData';

interface SavedMapsModalProps {
  onClose: () => void;
}

export function SavedMapsModal({ onClose }: SavedMapsModalProps) {
  const [saves, setSaves] = useState<SavedMap[]>([]);
  const importMap = useMapStore((s) => s.importMap);
  const setMapName = useMapStore((s) => s.setMapName);
  const setCanvasSize = useMapStore((s) => s.setCanvasSize);
  const triggerFitView = useMapStore((s) => s.triggerFitView);

  useEffect(() => {
    setSaves(listSavedMaps());
  }, []);

  const handleLoad = (save: SavedMap) => {
    importMap({ nodes: save.nodes, edges: save.edges });
    setMapName(save.name);
    setCanvasSize(save.canvasWidth ?? 1200, save.canvasHeight ?? 900);
    setTimeout(() => triggerFitView(), 100);
    onClose();
  };

  const handleLoadExample = () => {
    importMap({ nodes: SEED_NODES, edges: SEED_EDGES });
    setMapName('Universal Credit Claim Journey');
    setTimeout(() => triggerFitView(), 100);
    onClose();
  };

  const handleDelete = (id: string) => {
    deleteSavedMap(id);
    setSaves(listSavedMaps());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Database size={16} className="text-indigo-500" />
            <h2 className="text-sm font-semibold text-gray-800">Saved Maps</h2>
            <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
              stored in browser
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* Examples */}
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">Examples</p>
            <div
              className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 bg-blue-50/60 hover:border-blue-300 hover:bg-blue-50 group transition-all cursor-pointer"
              onClick={handleLoadExample}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <BookOpen size={14} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">Universal Credit Claim Journey</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[11px] text-gray-500">20 nodes · 22 edges</p>
                  <span className="flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 bg-blue-100 rounded-full px-1.5 py-0.5">
                    <Star size={8} className="fill-blue-600" />
                    Default example
                  </span>
                </div>
              </div>
              <button className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors opacity-0 group-hover:opacity-100">
                <FolderOpen size={11} />
                Open
              </button>
            </div>
          </div>

          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">Your saved maps</p>

          {saves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderOpen size={32} className="text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-400">No saved maps yet</p>
              <p className="text-xs text-gray-300 mt-1">
                Use the Save button in the toolbar to save your current map
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {saves.map((save) => (
                <div
                  key={save.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/40 group transition-all"
                >
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{save.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock size={10} />
                        {formatSavedAt(save.savedAt)}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {save.nodeCount} nodes · {save.edgeCount} edges
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDelete(save.id)}
                      className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => handleLoad(save)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                    >
                      <FolderOpen size={11} />
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-[11px] text-gray-400">
            Maps are saved in your browser's local storage. They'll persist across sessions
            but are tied to this browser. Use Export to share or back up a map as a file.
          </p>
        </div>
      </div>
    </div>
  );
}
