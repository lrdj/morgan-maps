import { useRef, useState } from 'react';
import {
  Plus,
  // Zap, // unused while Analyse button is hidden
  // Layers, // unused while Overlays are hidden
  SlidersHorizontal,
  // ShieldAlert, // unused while Risks button is hidden
  Download,
  Upload,
  Maximize2,
  Map,
  LayoutGrid,
  FilePlus,
  Save,
  FolderOpen,
  ChevronDown,
  Check,
  FolderClosed,
  HelpCircle,
} from 'lucide-react';
import { useMapStore, CANVAS_SIZE_PRESETS } from '../../store/mapStore';
import { exportToJSON, importFromJSON } from '../../utils/exportImport';
import { saveMap } from '../../utils/localSaves';
import { SavedMapsModal } from '../Modals/SavedMapsModal';

interface MainToolbarProps {
  onAddNode: () => void;
  onFitView: () => void;
}

export function MainToolbar({ onAddNode, onFitView }: MainToolbarProps) {
  const mapName = useMapStore((s) => s.mapName);
  const setMapName = useMapStore((s) => s.setMapName);
  const nodes = useMapStore((s) => s.nodes);
  const edges = useMapStore((s) => s.edges);
  const activePanel = useMapStore((s) => s.activePanel);
  const setActivePanel = useMapStore((s) => s.setActivePanel);
  // const overlays = useMapStore((s) => s.overlays); // unused while Overlays are hidden
  const filters = useMapStore((s) => s.filters);
  // const computeRiskFlags = useMapStore((s) => s.computeRiskFlags); // unused while Analyse button is hidden
  const importMap = useMapStore((s) => s.importMap);
  const gridLocked = useMapStore((s) => s.gridLocked);
  const canvasWidth = useMapStore((s) => s.canvasWidth);
  const canvasHeight = useMapStore((s) => s.canvasHeight);
  const setCanvasSize = useMapStore((s) => s.setCanvasSize);
  const newMap = useMapStore((s) => s.newMap);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(mapName);
  const [showSavedMaps, setShowSavedMaps] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showCanvasMenu, setShowCanvasMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);

  // const totalRiskFlags = nodes.reduce((acc, n) => acc + n.data.riskFlags.length, 0); // unused while Risks button is hidden
  // const activeOverlayCount = (Object.keys(overlays) as (keyof typeof overlays)[]).filter((k) => overlays[k]).length; // unused while Overlays are hidden

  const hasActiveFilters =
    filters.nodeTypes.length > 0 ||
    filters.organisations.length > 0 ||
    filters.tags.length > 0 ||
    filters.criticalityRange[0] > 0 ||
    filters.criticalityRange[1] < 1 ||
    filters.automationRange[0] > 0 ||
    filters.automationRange[1] < 1;

  const handleExport = () => {
    exportToJSON(mapName, nodes, edges);
    setShowFileMenu(false);
  };

  const handleImport = async (file: File) => {
    try {
      const data = await importFromJSON(file);
      importMap(data);
      if (data.name) setMapName(data.name);
    } catch (e) {
      console.error('Import failed:', e);
    }
  };

  const handleSave = () => {
    saveMap({ name: mapName, canvasWidth, canvasHeight, gridLocked, nodes, edges });
    setSaveFlash(true);
    setShowFileMenu(false);
    setTimeout(() => setSaveFlash(false), 1500);
  };

  const handleNewMap = () => {
    if (nodes.length > 0 && !window.confirm('Start a new map? Unsaved changes will be lost.')) return;
    newMap();
    setShowFileMenu(false);
  };

  const togglePanel = (panel: typeof activePanel) => {
    setActivePanel(activePanel === panel ? 'none' : panel);
  };

  return (
    <>
    <div className="flex items-center h-14 px-4 bg-white border-b border-gray-200 gap-3 flex-shrink-0 z-10">
      {/* Logo / App name */}
      <div className="flex items-center gap-2 mr-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Map size={14} className="text-white" />
        </div>
        <span className="text-sm font-bold text-gray-800 tracking-tight">Morgan Map</span>
      </div>

      {/* Map name */}
      <div className="flex items-center gap-2">
        {editingName ? (
          <input
            autoFocus
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={() => {
              setMapName(nameDraft || mapName);
              setEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setMapName(nameDraft || mapName);
                setEditingName(false);
              }
              if (e.key === 'Escape') setEditingName(false);
            }}
            className="text-sm font-medium text-gray-700 border border-blue-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-100 w-56"
          />
        ) : (
          <button
            onClick={() => { setNameDraft(mapName); setEditingName(true); }}
            className="text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded px-1 py-0.5 transition-colors"
            title="Click to rename map"
          >
            {mapName}
          </button>
        )}
        <span className="text-[11px] text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
          {nodes.length} nodes · {edges.length} edges
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Nav items */}
      <div className="flex items-center gap-1">

        {/* Add Node */}
        <button
          onClick={onAddNode}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          <Plus size={13} />
          Add Node
        </button>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* Canvas Size */}
        <div className="relative">
          <button
            onClick={() => setShowCanvasMenu((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showCanvasMenu ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title="Canvas size"
          >
            <LayoutGrid size={13} />
            Canvas Size
            <ChevronDown size={11} className={`transition-transform ${showCanvasMenu ? 'rotate-180' : ''}`} />
          </button>
          {showCanvasMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowCanvasMenu(false)} />
              <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1 overflow-hidden">
                {CANVAS_SIZE_PRESETS.map((p) => {
                  const isActive = canvasWidth === p.w && canvasHeight === p.h;
                  return (
                    <button
                      key={`${p.w}x${p.h}`}
                      onClick={() => { setCanvasSize(p.w, p.h); setShowCanvasMenu(false); }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs transition-colors ${
                        isActive ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{p.label}</span>
                      {isActive && <Check size={11} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Filters */}
        <button
          onClick={() => togglePanel('views')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activePanel === 'views' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title="Toggle filters"
        >
          <SlidersHorizontal size={13} />
          Filters
          {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
        </button>

        {/* File */}
        <div className="relative" ref={fileMenuRef}>
          <button
            onClick={() => setShowFileMenu((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showFileMenu ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {saveFlash ? <Check size={13} className="text-green-600" /> : <FolderClosed size={13} />}
            {saveFlash ? <span className="text-green-600">Saved!</span> : 'File'}
            <ChevronDown size={11} className={`transition-transform ${showFileMenu ? 'rotate-180' : ''}`} />
          </button>
          {showFileMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowFileMenu(false)} />
              <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1 overflow-hidden">
                <button onClick={handleSave} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                  <Save size={13} className="text-gray-400" />Save
                </button>
                <button onClick={() => { setShowSavedMaps(true); setShowFileMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                  <FolderOpen size={13} className="text-gray-400" />Open
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button onClick={handleNewMap} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                  <FilePlus size={13} className="text-gray-400" />New
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button onClick={handleExport} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                  <Download size={13} className="text-gray-400" />Export as JSON
                </button>
                <button onClick={() => { fileInputRef.current?.click(); setShowFileMenu(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                  <Upload size={13} className="text-gray-400" />Import from JSON
                </button>
              </div>
            </>
          )}
        </div>

        {/* Guide */}
        <button
          onClick={() => togglePanel('help')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activePanel === 'help' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title="Guide"
        >
          <HelpCircle size={13} />
          Guide
        </button>

        <div className="w-px h-5 bg-gray-200 mx-0.5" />

        {/* Fit view */}
        <button
          onClick={onFitView}
          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
          title="Fit to view"
        >
          <Maximize2 size={13} />
        </button>

      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImport(file);
          e.target.value = '';
        }}
      />
    </div>

    {showSavedMaps && <SavedMapsModal onClose={() => setShowSavedMaps(false)} />}
    </>
  );
}
