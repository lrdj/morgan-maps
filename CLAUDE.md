# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **There are now two implementations in this repo.** The original React /
> ReactFlow / Tailwind prototype lives at the repo root (this file). A
> plain-JS / Express rebuild with full feature parity lives in
> [`morgan-maps-express/`](./morgan-maps-express/) — that directory has its
> own `README.md`, `ROADMAP.md`, `CHANGELOG.md`, and `CLAUDE.md`.
>
> The Express edition is the canonical project going forward; the React
> tree is kept for visual diffing during the port. Plan to delete it once
> the Express edition has been verified in active use. See
> `morgan-maps-express/ROADMAP.md` for the swap plan and the GOV.UK
> Prototype Kit context.

## Commands

```bash
npm run dev       # Dev server at http://localhost:5173
npm run build     # TypeScript check + Vite build → ../../dist/morgan-map
npm run preview   # Preview production build
```

There are no test or lint scripts configured. TypeScript is the primary correctness check (`tsc --noEmit` is run as part of `build`).

## What this is

**Morgan Map** is a client-side React + TypeScript tool for visualizing service automation decisions using a Wardley-style canvas. It has no backend; all state lives in Zustand and persists only via JSON export/import or localStorage.

The canvas X-axis is **automation level** (0 = human-led → 1 = fully automated), Y-axis is **decision criticality** (0 = routine → 1 = critical). Node positions are stored as axis values (0–1) and converted to canvas pixels on render.

## Architecture

```
src/
├── App.tsx              # Root layout: MainToolbar | MapCanvas | right Panel
├── store/mapStore.ts    # All state + actions (Zustand). Single source of truth.
├── types/index.ts       # All shared types: NodeType, RelationshipType, OverlayType, etc.
├── components/
│   ├── MapCanvas/       # ReactFlow wrapper + node/edge renderers
│   │   ├── index.tsx    # Main canvas: event handlers, filtering, ReactFlow config
│   │   ├── nodes/       # One component per node type; NodeShell.tsx is shared renderer
│   │   └── edges/       # RelationshipEdge.tsx handles all 6 relationship types
│   ├── Toolbar/         # File ops, canvas presets, filter controls
│   ├── Panel/           # Right-side panels (NodeDetailPanel, ViewsPanel, HelpPanel)
│   └── Modals/          # Create/edit nodes and edges, save browser, welcome screen
├── utils/
│   ├── coordinates.ts   # axisToCanvas() / canvasToAxis() — axis↔pixel math
│   ├── exportImport.ts  # JSON export/import (schema: public/schema.json)
│   ├── localSaves.ts    # localStorage helpers
│   └── stepNumbers.ts   # Auto-numbering node labels
└── data/seedData.ts     # Default map (UC claim journey across DWP, HMRC, NHS, etc.)
```

## Key conventions

- **Node types** (8): `decision`, `evidence`, `execution`, `interface`, `team`, `data`, `policy`, `sharedCapability`. Legacy types `caseObject` and `touchpoint` exist in nodes/ but are not in the primary type union.
- **Relationship types** (6): `informs`, `constrains`, `triggers`, `transfersTo`, `reviews`, `escalatesTo`.
- **Overlays** (5 visual toggles): `orgBoundaries`, `pathway`, `frictionPoints`, `policyConstraints`, `dataQuality`.
- Adding a new node type requires: a type entry in `types/index.ts`, a component in `components/MapCanvas/nodes/`, registration in `nodes/index.ts` nodeTypes map, and any needed handling in `CreateNodeModal`.
- The build output path (`../../dist/morgan-map`) and base path (`/morgan-map`) in `vite.config.ts` are intentional — this project is expected to be deployed as a subdirectory of a parent site.

## Public assets

- `public/schema.json` — JSON schema for the map export format
- `public/llm-guide.md` — guidance doc for AI-assisted map generation
- `public/dvla-drivers-medical.json`, `public/victims-pathway.json` — example maps
