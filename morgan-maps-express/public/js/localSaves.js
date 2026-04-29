const STORAGE_KEY = 'morgan-map:saves';

export function listSavedMaps() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveMap(map) {
  const saves = listSavedMaps();
  const existing = saves.findIndex((s) => s.name === map.name);
  const entry = {
    ...map,
    id: existing >= 0 ? saves[existing].id : `map_${Date.now()}`,
    savedAt: new Date().toISOString(),
    nodeCount: map.nodes.length,
    edgeCount: map.edges.length,
  };
  if (existing >= 0) saves[existing] = entry;
  else saves.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
  return entry;
}

export function deleteSavedMap(id) {
  const saves = listSavedMaps().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
}

export function formatSavedAt(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
