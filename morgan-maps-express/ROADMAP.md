# Roadmap

This roadmap captures what's likely worth doing next, in roughly increasing
order of effort. Nothing here is committed — it's a thinking document.

## Done in v0.1.0

- Full visual + behavioural parity with the React/ReactFlow original.
- Hand-rolled DOM + SVG canvas (pan, zoom, drag, double-click-to-add,
  selection, trace fading, minimap, lock-nodes, box-select toggle).
- Toolbar, three right-rail panels, four modals.
- Auto step-numbering with branches and manual override.
- JSON import / export and `localStorage` saved maps.

## Near term — finish-the-job polish

- **Replace original codebase with the Express edition.** Keep
  `morgan-maps-express/` as the canonical project. Delete the React tree
  (`src/`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`,
  `tsconfig*.json`, root `index.html`, root `package*.json`, `dist/`) once
  we've decided no React-only artefacts are needed.
- **In-browser smoke test.** Walk through every interaction once: load
  example, drag a node, edit a node (commit + cancel), edit an edge,
  delete a node, filter, save, export, import, fit view, lock, minimap,
  canvas-size change, welcome reload.
- **Confirm behaviour at extremes.** Very small canvas (Small preset),
  very large canvas (XL preset), zero-node empty map, very long titles,
  many tags.
- **Edge creation.** The original allowed dragging from one node handle
  to another to create an edge. The current rebuild has node-click
  selection but no drag-to-connect. Decide whether to add it (involves
  per-node connection handles) or leave edge creation to import only.

## Medium term — practical workflow improvements

- **Multi-select.** Box-select mode (control already exists) currently
  only changes the cursor — wire it up to actually drag a rectangle and
  select the nodes inside.
- **Keyboard shortcuts.** `Esc` to deselect, `Delete` to delete the
  selected node/edge, `F` for fit-view, `Cmd+S` to save, `Cmd+Z` for
  undo (requires undo history).
- **Undo / redo.** A simple stack of state snapshots taken on every
  action (capped at, say, 50 entries).
- **Real arrowhead orientation.** The current bezier path has a default
  orientation; for very curvy edges the arrowhead can look mis-aligned
  near the target. Use `auto-start-reverse` plus an end-tangent
  calculation if it bites.

## GOV.UK Prototype Kit alignment

The strategic reason this rebuild exists is to make porting to the
[GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk/docs/)
straightforward. A possible plan:

1. **Authoring in the kit.** Build the workflow for assembling a Morgan
   Map JSON record inside a Prototype-Kit project — multi-step forms for
   adding nodes, attaching evidence, picking relationship types, etc.
2. **Static viewer.** Treat this Express app as the *viewer* — the
   destination where the JSON is rendered. The kit handles authoring;
   this app handles visualisation. They share the schema in
   `public/schema.json`.
3. **PDF or static-image export.** For circulation to colleagues without
   browser access to the viewer, render the canvas to a PDF or PNG
   server-side. Likely candidates: headless Chromium via Puppeteer, or
   a simple `<canvas>` snapshot library.
4. **GOV.UK styling.** If the viewer ever ships inside a service, swap
   the CSS palette for `govuk-frontend` tokens and adopt the GOV.UK
   typography. The structure is already utility-light enough that this
   is a one-stylesheet swap.

## Longer term — open questions

- **Server-side persistence.** Replace `localStorage` with a backend
  store. The Express server already exists; this is mostly a SQLite
  schema and four endpoints (`GET /maps`, `POST /maps`, `GET /maps/:id`,
  `DELETE /maps/:id`). Authentication is the harder problem — depends on
  who the users are.
- **Collaboration.** A long-running goal of the original. A CRDT layer
  (Yjs or Automerge) over the JSON model would be the cleanest route.
  Not pursued unless there's a real user need.
- **Testing.** The codebase currently has no tests. A handful of unit
  tests for `coordinates.js`, `stepNumbers.js`, and the import overlap
  logic would catch the things that are easiest to break.
