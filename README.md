# Morgan Map

A service automation and criticality mapping tool inspired by Wardley Mapping. Morgan Map helps teams visualise and analyse the automation level and decision criticality of every component in a service — surfacing design tensions, risk patterns, and automation opportunities.

---

## The Axis Model

Morgan Map plots every service component on a two-dimensional canvas:

### X Axis — Level of Automation (left → right)
| Position | Label | Meaning |
|---|---|---|
| 0.0 | Fully Human | Entirely manual, no digital support |
| 0.17 | Human + Digital | Human-led with digital tooling |
| 0.33 | Human + AI | Human-led with AI assistance |
| 0.5 | Mixed | Shared human/AI responsibility |
| 0.67 | AI + Oversight | AI-led with human review |
| 0.83–1.0 | Fully Automated | No human in the loop |

### Y Axis — Decision Criticality (bottom → top)
| Position | Label | Meaning |
|---|---|---|
| 0.0 | Routine | Low consequence, easily reversible |
| 0.25 | Operational | Moderate importance |
| 0.5 | Important | Significant service impact |
| 0.75 | High-Impact | Consequential decisions |
| 1.0 | Critical | Safety, rights, legal, financial, or reputational |

### The Design Tension Quadrants
- **Top-right (high automation + high criticality)**: The "danger zone" — high-stakes decisions with minimal human oversight. These warrant urgent scrutiny.
- **Bottom-left (low automation + low criticality)**: The "opportunity zone" — routine work that is still manual and may be good automation candidates.
- **Top-left (low automation + high criticality)**: Human-intensive critical decisions — often appropriate, but capacity-constrained.
- **Bottom-right (high automation + low criticality)**: Well-optimised routine processing.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

The app loads with a pre-built Universal Credit claim journey as seed data, demonstrating the mapping technique across DWP, HMRC, NHS, GDS, and HMCTS.

---

## Key Features

- **Interactive canvas** — drag nodes, pan, zoom; positions update axis values in real time
- **8 node types** — Decision, Touchpoint, System, Team, Policy, Data, Case Object, Shared Capability
- **8 relationship types** — with distinct visual styles (solid, dashed, dotted) and colours
- **Automated risk analysis** — 6 heuristic risk flags and 2 opportunity patterns computed across the map
- **7 overlays** — toggle visual treatments: org boundaries, service journey, trust level, user pain points, manual effort, policy constraints, data quality
- **Filter system** — filter by node type, organisation, tags, criticality range, automation range
- **Scenario toggle** — switch between Current State and Future State views
- **Export/Import** — save the full map as JSON, reload from file
- **Risk Insights panel** — summary dashboard of all flags and opportunities with auto-generated insight sentences

---

## Design Rationale

Morgan Map applies Wardley Mapping's "position on a value chain / evolution axis" logic to the specific challenge of responsible AI and automation in public services. The two axes were chosen because:

1. **Automation level** is the primary strategic variable — it determines where human judgement sits and where technical systems take over.
2. **Decision criticality** determines how much it matters if something goes wrong — driving proportionality in oversight requirements.

The intersection of these two axes reveals where a service may be over- or under-automating relative to the stakes involved.

---

## How to Extend

### Add persistence
Replace the in-memory Zustand store initialisation with `localStorage` persistence using Zustand's `persist` middleware:

```ts
import { persist } from 'zustand/middleware'
// wrap create() with persist(...)
```

### Add a backend
Replace `exportToJSON` / `importFromJSON` with API calls to a REST or GraphQL backend. The `MapExport` type in `src/utils/exportImport.ts` defines the schema.

### Add more node types
1. Add the type to the `NodeType` union in `src/types/index.ts`
2. Create a new component in `src/components/MapCanvas/nodes/`
3. Register it in `src/components/MapCanvas/nodes/index.ts`
4. Add it to the `NODE_TYPE_LABELS` map

### Add more risk heuristics
Add cases to `computeAllRiskFlags()` in `src/utils/riskAnalysis.ts`.

### Add team collaboration
Integrate a CRDT library (e.g. Yjs + y-websocket) and connect the Zustand store to a shared document for real-time multi-user editing.
