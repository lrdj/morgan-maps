_This work is a fork of @tomwm's work at https://github.com/tomwm/tomwm-lab -- There is a readme that explains the map function before conversion to Express at README-tomwm.md_

# Morgan Map (Express edition)

A decision-centred service-mapping tool. Plots the elements of a service on two
axes — **automation** (left → right) and **criticality** (bottom → top) — and
lets you connect them with typed relationships to expose where human judgment
matters, where automation is sensible, and where trust may be at risk.

This is a port of the original React + ReactFlow + Tailwind prototype to a
plain-JS Express stack with hand-rolled DOM/SVG. **It reproduces the original
visual and behavioural design end-to-end** while removing every framework
dependency except Express itself.

---

## Why this rebuild exists

React and Tailwind create hard-to-maintain, complex codebases — I say that as
someone who doesn't have access to a React developer. React is also a fruit
of Facebook, which in my personal opinion is a poisoned tree.

The kinds of web services I work with are not Facebook. They do not require
real-time updating of thousands of little page fragments, so React's
virtual-DOM approach is the wrong tool: too heavy, too complicated, and not
appropriate for the work.

The human factor matters too. I work with the
[GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk/docs/), so if I
were making a tool to support decision-making or to help UK civil servants
understand service structures, I'd want to prototype it in that kit. In this
case, if I wanted to test how a worker might assemble a JSON record of a
service — how they save, upload, and edit it — I'd do that in the kit. The
viewer would become a downloadable PDF or some other static alternative.

By converting this application from React to Express, the move into the
Prototype Kit becomes much easier: the kit is itself an Express application.

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173 (or set PORT=…)
```

There is no build step. Open the URL, choose **Load example map** in the
welcome screen, and you'll see the Universal Credit claim journey rendered
across DWP, HMRC, NHS, GDS, and HMCTS.

---

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Server | **Express 4** | Static file server only — no SSR, no API |
| Client | **Plain JavaScript (ES modules)** | No bundler, no transpiler, no React |
| Styling | **Plain CSS** | Tailwind palette mirrored as CSS custom properties |
| Graph | Hand-rolled DOM + SVG | Pan/zoom via CSS transform; edges in SVG; nodes are absolutely-positioned `<div>`s |
| State | Module-level store + tiny pub/sub | Mirrors the shape of the original Zustand store |
| Persistence | JSON export / import + `localStorage` | Same `morgan-map:saves` key as the original |
| Icons | Inline SVG | Not lucide-react, not lucide-static |

The whole runtime is **one Express dependency**. Everything else is in `public/`.

---

## File map

```
morgan-maps-express/
├── server.js                       # Express static server + SPA fallback
├── package.json                    # express only
├── public/
│   ├── index.html                  # Single shell — mounts toolbar/canvas/panel/modal
│   ├── css/styles.css              # Full stylesheet (CSS variables for colours)
│   ├── js/
│   │   ├── app.js                  # Entry — mounts components, opens welcome modal
│   │   ├── state.js                # Single source of truth + actions + pub/sub
│   │   ├── constants.js            # Type/relationship/scale metadata
│   │   ├── coordinates.js          # axis ↔ canvas pixel maths
│   │   ├── stepNumbers.js          # Auto-derived step labels (1, 2a, 2b, …)
│   │   ├── exportImport.js         # JSON file IO
│   │   ├── localSaves.js           # Browser-storage saved maps
│   │   ├── seedData.js             # UC Claim Journey example
│   │   ├── icons.js                # Inline SVG strings for all icons used
│   │   ├── canvas.js               # Pan / zoom / drag / nodes / edges / axis / minimap
│   │   ├── toolbar.js              # Top toolbar (name, file menu, canvas size, filters)
│   │   ├── panels/
│   │   │   ├── nodeDetail.js       # Right-rail node detail panel (view + edit)
│   │   │   ├── viewsPanel.js       # Right-rail filters panel
│   │   │   └── helpPanel.js        # Right-rail guide panel
│   │   └── modals/
│   │       ├── welcomeModal.js
│   │       ├── createNodeModal.js
│   │       ├── createEdgeModal.js
│   │       └── savedMapsModal.js
│   ├── schema.json                 # JSON schema for the import format
│   ├── llm-guide.md                # Guide for AI-assisted map generation
│   ├── social/morgan-map-linkedin.png
│   ├── dvla-drivers-medical.json   # Example map
│   └── victims-pathway.json        # Example map
```

---

## The map model

**Node types (4):**

| Type | Colour | Meaning |
|---|---|---|
| `decision` | amber `#f59e0b` | A judgment, choice, or classification |
| `evidence` | teal `#14b8a6` | Information or signals supporting a decision |
| `execution` | purple `#7c3aed` | An action that operationalises a decision |
| `interface` | blue `#3b82f6` | A human touchpoint |

**Relationship types (6):**

| Type | Style |
|---|---|
| `informs` | grey, solid |
| `triggers` | blue, solid |
| `constrains` | rose, dashed |
| `transfersTo` | emerald, dashed |
| `reviews` | amber, dotted |
| `escalatesTo` | orange, thick solid |

**Coordinates:** Node X derives from `automationLevel` (0–1), Y from
`criticalityLevel` (0–1), with `(0, 1)` placing a node bottom-left and
`(1, 0)` placing it top-right. Pixel positions are recomputed on every
import or canvas-size change so the JSON stays portable.

---

## Features (parity with the React original)

- Welcome modal — load example or start blank
- Top toolbar — editable map name, node/edge counts, Add Node, Canvas Size
  presets (Small / Standard / Large / XL), Filters toggle, File menu
  (Save / Open / New / Export JSON / Import JSON), Guide toggle, Fit View
- Canvas — pan, zoom (wheel + buttons), drag nodes, double-click to add a
  node where you clicked, dotted background that pans with the viewport,
  axis grid + AUTOMATION/CRITICALITY titles, bottom-right controls
  (zoom in/out, box-select toggle, lock-nodes toggle, minimap toggle)
- Nodes — coloured border (3px when selected, dashed when planned, 50%
  opacity when deprecated), type badge with shape icon, auto step-number
  badge, title, organisation footer, friction-point red dot, data-quality
  hatched background, policy-constraints pink top border, org-boundaries
  dashed outer ring, ancestor (indigo) / descendant (emerald) trace rings
- Edges — typed bezier paths with floating border attachment, mid-point
  pill label, click to edit, trace-fade for off-path edges
- Right-rail panels — Node Detail (view + edit modes with live sliders that
  reposition the node as you drag), Filters (range sliders for criticality
  and automation, type / organisation / tag filters, show step numbers),
  Guide (full reference content from the original)
- Modals — Welcome, Create / Edit Node (full form with sliders), Edit Edge
  (relationship-type picker grid + description + delete), Saved Maps
  (browser-stored list + the example map)
- Auto step numbering — derived from `triggers` / `transfersTo` flow edges
  with branches as `1a` / `1b`, manual override, suppress with empty string
- Trace fading — selecting a node fades nodes and edges off its ancestor /
  descendant path
- Persistence — JSON export and import + `localStorage` saves under
  `morgan-map:saves`, with overlap-nudge so two nodes don't land on top of
  each other when re-imported

---

## Architecture notes

- **State.** A single mutable object in `state.js` plus a `Set` of subscribers.
  Components subscribe on mount and re-render when relevant keys change.
  Actions are plain functions that `Object.assign` into the object and
  notify. There's no immutability or diffing infrastructure — for ~25 nodes
  / ~25 edges, full-DOM rerenders of components are imperceptibly fast.
- **Viewport.** Pan and zoom are kept *out* of the shared store, in
  `canvas.js` module state. This stops every mousemove during a pan from
  re-rendering the toolbar and panels.
- **Right-rail panels** share one DOM host. Each panel tracks an `owned`
  flag so only the panel that previously owned the host clears it on
  transition — this avoids panels stomping on each other.
- **No build step.** Browsers load the modules directly via `<script
  type="module">`. Edit a file, refresh the page, see the change.

---

## Extending

### Add a new node type

1. Add the type to `NODE_TYPES` in `public/js/constants.js` and give it a
   label, colour, and short / long description.
2. Add an icon shape to `NODE_SHAPES` in `public/js/canvas.js`.
3. Update the `Node` and `NodeData.nodeType` enums in
   `public/schema.json` if you want the import format to recognise it.

### Add a new relationship type

1. Add it to `RELATIONSHIP_TYPES`, `RELATIONSHIP_LABELS`,
   `RELATIONSHIP_SHORT`, `RELATIONSHIP_LONG`, `EDGE_STYLES`, and
   `EDGE_SHORT_LABELS` in `public/js/constants.js`.
2. Update the `EdgeData.relationshipType` enum in `public/schema.json`.
3. Decide whether it should count as a *flow* edge for step numbering —
   if yes, add it to `FLOW_TYPES` in `public/js/stepNumbers.js`.

### Wire up a backend

`server.js` is intentionally minimal. To persist maps server-side, add a
small JSON endpoint and switch `localSaves.js` to call it instead of
`localStorage`. The export schema in `exportImport.js` defines the wire
format.

---

## Roadmap

See [`ROADMAP.md`](./ROADMAP.md).

## Release history

See [`CHANGELOG.md`](./CHANGELOG.md).
