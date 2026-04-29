# CLAUDE.md

Guidance for Claude Code working on the **Express edition** of Morgan Map.

## Commands

```bash
npm install     # one-time, installs Express only
npm run dev     # http://localhost:5173 (PORT=… overrides)
npm start       # alias of dev — there is no build step
```

There are no test or lint scripts. There is no bundler, no transpiler, no
TypeScript. Files are served as-is by Express.

## What this is

A plain-JS / Express rebuild of a React + ReactFlow + Tailwind prototype.
**Functional and visual parity is the bar.** The original lives in the
parent directory (`../src/`, etc.) and is the reference; reach for it any
time you need to verify behaviour.

The product itself: a decision-centred service-mapping tool. Nodes are
plotted on two axes — **automation** (X) and **criticality** (Y) — and
connected by typed relationships. See `README.md` for the full feature
list and `../README.md` for the original product rationale.

## Stack

- **Server:** Express 4 (`server.js`). Static files only — no SSR, no API.
- **Client:** ES modules, no bundler. Loaded directly via `<script type="module">`.
- **Styling:** plain CSS in `public/css/styles.css`. Tailwind palette
  mirrored as CSS custom properties (`--gray-100`, `--blue-500`, …).
- **Graph:** hand-rolled in `public/js/canvas.js`. Pan / zoom via CSS
  transform on a `.canvas-viewport` div. Nodes are absolute-positioned
  `<div>`s. Edges are SVG bezier paths. The axis grid is SVG.
- **State:** module-level object + `Set` of subscribers in
  `public/js/state.js`. No immutability, no diffing — full-DOM rerenders
  for ~25 nodes / ~25 edges are fast enough not to need anything cleverer.
- **Icons:** inline SVG strings in `public/js/icons.js`. No `lucide-*`.
- **Persistence:** JSON file export / import + `localStorage` saves under
  the key `morgan-map:saves`.

## Architecture

```
server.js
public/
├── index.html          ← shell with #toolbar, #canvas-host, #right-panel, #modal-host
├── css/styles.css      ← single stylesheet
└── js/
    ├── app.js          ← entry; mounts everything; opens welcome modal
    ├── state.js        ← getState / subscribe / setState / actions
    ├── constants.js    ← types, labels, colours, scales, presets
    ├── coordinates.js  ← axisToCanvas / canvasToAxis
    ├── stepNumbers.js  ← flow-edge step derivation (1, 2a, 2b, …)
    ├── exportImport.js ← JSON file IO
    ├── localSaves.js   ← localStorage helpers
    ├── seedData.js     ← UC Claim Journey example (20 nodes, 22 edges)
    ├── icons.js        ← inline SVG strings
    ├── canvas.js       ← pan / zoom / drag / nodes / edges / axis / minimap
    ├── toolbar.js      ← top toolbar (with file menu, canvas size, etc.)
    ├── panels/
    │   ├── nodeDetail.js
    │   ├── viewsPanel.js
    │   └── helpPanel.js
    └── modals/
        ├── welcomeModal.js
        ├── createNodeModal.js
        ├── createEdgeModal.js
        └── savedMapsModal.js
```

### State conventions

`state.js` exports:
- `getState()` — returns the live state object (mutable; do not write to it
  outside actions).
- `subscribe(fn)` — registers a listener; returns an unsubscribe.
- `setState(patchOrFn)` — assigns into state and notifies listeners.
- `actions.*` — every named action that may mutate state (addNode,
  updateNode, selectNode, setActivePanel, importMap, etc.).

The right-rail panels share one DOM host (`#right-panel`). Each panel
tracks an `owned` flag so only the panel currently rendered clears the
host on transition. Without that flag, the three panels stomp on each
other as the activePanel changes.

The viewport (pan + zoom) is intentionally **not** in shared state —
it lives in `canvas.js` module state. Putting it in `state.js` causes
every mousemove during a pan to re-render the toolbar.

### Adding a node type

1. Extend `NODE_TYPES`, `NODE_TYPE_LABELS`, `NODE_TYPE_COLOURS` in
   `constants.js`.
2. Add an icon shape entry to `NODE_SHAPES` in `canvas.js`.
3. Optionally update the enums in `public/schema.json`.

### Adding a relationship type

1. Extend `RELATIONSHIP_TYPES` and the four label / style maps in
   `constants.js`.
2. Decide whether it counts as a flow edge for step numbering — if yes,
   add it to `FLOW_TYPES` in `stepNumbers.js`.
3. Optionally update `public/schema.json`.

## Conventions

- **No emojis** in code, comments, or docs unless the user explicitly asks.
- **No build step.** Edit a file, refresh the browser. Never introduce a
  bundler, transpiler, or framework as part of routine work.
- **No new dependencies** without explicit user approval. The dependency
  list is `express`. That is the budget.
- **Don't bring back React patterns.** No JSX, no hooks-style abstractions,
  no virtual DOM. Direct DOM.
- **Match the original visually.** When in doubt, open the React app
  side-by-side and compare. The Tailwind classes in `../src/` map
  directly to the CSS rules in `public/css/styles.css`.

## Strategic context

The end goal is to make this tool easy to port into the
[GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk/docs/), which
is itself an Express app. React was an obstacle to that. See `README.md`
for the longer rationale and `ROADMAP.md` for the prototype-kit migration
plan.

## Where the React original lives

`../` (the parent directory). Specifically:

- `../src/App.tsx`, `../src/store/mapStore.ts`, `../src/types/index.ts`
- `../src/components/MapCanvas/`, `../src/components/Panel/`,
  `../src/components/Modals/`, `../src/components/Toolbar/`
- `../src/data/seedData.ts`, `../src/utils/`
- `../public/schema.json`, `../public/llm-guide.md`

The React tree will be removed once the Express edition has been used in
anger and any stragglers spotted. Until then it stays as the reference.
