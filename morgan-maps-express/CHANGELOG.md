# Changelog

All notable changes to the Express edition of Morgan Map.

The format is loosely based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] — 2026-04-29

First release of the Express edition. Full feature parity with the original
React / ReactFlow / Tailwind prototype, ported to plain JavaScript ES modules
with a hand-rolled canvas. The only runtime dependency is Express.

### Added
- Express server (`server.js`) serving `public/` as a SPA, with `.json` and
  `.md` content-type hints and an SPA fallback.
- Module-level state store with pub/sub and a complete actions surface
  matching the original Zustand store.
- Hand-rolled canvas (`canvas.js`):
  - Pan / zoom via CSS transform on a viewport `<div>`.
  - Mouse-wheel zoom around the cursor.
  - Drag-to-move nodes; live axis-value sync during drag.
  - Double-click empty space to create a node at that position.
  - Floating-point bezier edges with per-relationship arrowhead colours
    and dashed / dotted stroke styles.
  - Mid-edge clickable label pills.
  - Selection / trace fading for ancestors (indigo ring) and descendants
    (emerald ring).
  - Axis background SVG with 5 × 5 grid, band labels, and rotated
    AUTOMATION / CRITICALITY titles.
  - Bottom-right control stack: zoom in/out, box-select toggle,
    lock-nodes toggle, minimap toggle.
  - Optional minimap.
  - Dotted background that pans with the viewport.
- Top toolbar (`toolbar.js`):
  - Editable map name, node/edge count pill.
  - Add Node primary button.
  - Canvas Size dropdown (4 presets).
  - Filters toggle that opens / closes the right-rail filters panel.
  - File menu — Save (with Saved! flash), Open (saved-maps modal), New
    (with confirmation), Export as JSON, Import from JSON.
  - Guide toggle.
  - Fit View button.
- Right-rail panels:
  - **Node Detail** (`panels/nodeDetail.js`) — view mode with metadata
    grid, position summary, description, notes, tags, connections list;
    edit mode mirroring the Create Node form, with live sliders that
    reposition the node on the canvas as the user drags.
  - **Filters / Views** (`panels/viewsPanel.js`) — show-step-numbers
    toggle; node-type checkboxes; criticality and automation min/max
    range sliders; organisation checkboxes; tag pills; reset all
    filters.
  - **Guide** (`panels/helpPanel.js`) — full reference content from the
    original: what the map is for, the axes, node types, edge types,
    a worked example chain, how to use the map, how to read the
    quadrants, and an "AI assistant" section linking the schema and
    LLM guide.
- Modals:
  - **Welcome** (`modals/welcomeModal.js`) — load example map / start
    blank.
  - **Create / Edit Node** (`modals/createNodeModal.js`) — full form
    with title (required), step override, type, status, organisation,
    owner, description, automation slider (5 stops), criticality
    slider, confidence slider, tags chips, notes.
  - **Edit Edge** (`modals/createEdgeModal.js`) — relationship type
    picker grid with long-form tooltips, description textarea, delete
    button.
  - **Saved Maps** (`modals/savedMapsModal.js`) — example card +
    list of `localStorage` saves with open / delete actions.
- Auto step numbering (`stepNumbers.js`) with branches (`1a`, `1b`),
  cycle handling, manual overrides, and suppress-with-empty-string.
- JSON export / import (`exportImport.js`).
- `localStorage` saved maps under the `morgan-map:saves` key
  (`localSaves.js`).
- Universal Credit Claim Journey seed map (20 nodes, 22 edges).
- Inline SVG icon set (`icons.js`) replacing `lucide-react`.
- Public assets: `schema.json`, `llm-guide.md`,
  `social/morgan-map-linkedin.png`, `dvla-drivers-medical.json`,
  `victims-pathway.json`.

### Notes
- No build step — modules load directly in the browser via
  `<script type="module">`.
- No tests yet. See `ROADMAP.md`.
- The original React project still lives next to this one in the
  parent directory, untouched, for visual diffing during the port.
