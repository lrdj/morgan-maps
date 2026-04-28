# Morgan Map — LLM guide for generating maps

## What is a Morgan Map?

A Morgan Map is a decision-centred diagram of a service or system. It plots service elements on two axes:

- **Automation** (X axis, left → right): How far an element is handled by software rather than humans. 0 = fully human, 1 = fully automated.
- **Criticality** (Y axis, bottom → top): How much an element matters to good outcomes and trust in the decision. 0 = routine/low-stakes, 1 = critical.

The map is designed to help people understand where human judgment still matters, where automation is sensible, and where trust may be at risk.

---

## How to generate a valid map

1. Read the full JSON schema at `/schema.json` (same origin as this file).
2. Produce a JSON file matching that schema.
3. The file can be imported directly into the Morgan Map application via **File → Import from JSON**.

---

## The four node types

| Type | Use when |
|------|----------|
| `decision` | A judgment, choice, determination, or classification is made |
| `evidence` | Information, rules, records, or signals that support or shape a decision |
| `execution` | An action that carries out or operationalises a decision |
| `interface` | A touchpoint where a person gives input, receives output, or experiences the system |

---

## The six edge (relationship) types

| Type | Use when |
|------|----------|
| `informs` | One element provides information or signals to another |
| `constrains` | One element sets rules or limits on another |
| `triggers` | One element causes another to begin |
| `transfersTo` | Work or responsibility passes from one to another |
| `reviews` | One element checks or quality-assures another |
| `escalatesTo` | Work passes to a higher-level handler when needed |

---

## Positioning guidance

Set `automationLevel` and `criticalityLevel` as 0–1 values. **Do not set `position.x` / `position.y`** — the app always derives canvas position from the axis values on import. Any position field in the JSON is ignored.

**Automation scale (5 levels):**

Use one of these five values. The scale is a simplified, practical version of levels of automation thinking — designed for mapping and discussion, not technical precision.

| Value | Level | Meaning |
|-------|-------|---------|
| 0.00 | Human-led | Done by people, with little or no automation |
| 0.25 | Assisted | People lead, with system support |
| 0.50 | Part-automated | Some parts automated, but people still do key steps |
| 0.75 | Conditionally automated | Automated in defined cases; humans handle exceptions, thresholds, or oversight |
| 1.00 | Fully automated | Handled end-to-end by the system with minimal human involvement |

**Criticality scale:**
- 0.0–0.2 — Routine, low-stakes
- 0.2–0.4 — Operational, some consequence if it fails
- 0.4–0.6 — Important, meaningful impact on outcomes
- 0.6–0.8 — High-impact, significant consequence
- 0.8–1.0 — Critical — failure would seriously damage outcomes or trust

---

## Confidence score

Use `confidenceScore` (0–1) to indicate how confident you are in the accuracy of each node's placement and description:
- 0.9+ — Well-documented, high confidence
- 0.7 — Reasonable confidence, some assumptions
- 0.5 — Moderate — limited public information
- 0.3 or below — Speculative

---

## Minimal valid example

```json
{
  "version": "1.0",
  "name": "Example Service",
  "nodes": [
    {
      "id": "n1",
      "data": {
        "title": "Application Form",
        "nodeType": "interface",
        "automationLevel": 0.3,
        "criticalityLevel": 0.4,
        "organisation": "DWP",
        "description": "Online form for applicants to submit their claim.",
        "owner": "DWP Digital",
        "tags": ["citizen-facing", "digital"],
        "status": "active",
        "confidenceScore": 0.8,
        "notes": "",
        "overlays": {},
        "riskFlags": [],
        "opportunities": []
      }
    },
    {
      "id": "n2",
      "data": {
        "title": "Eligibility Decision",
        "nodeType": "decision",
        "automationLevel": 0.55,
        "criticalityLevel": 0.85,
        "organisation": "DWP",
        "description": "Automated rules engine checks eligibility criteria. Complex cases escalate to a caseworker.",
        "owner": "DWP Benefits Processing",
        "tags": ["rules-engine", "ai-assisted"],
        "status": "active",
        "confidenceScore": 0.75,
        "notes": "Some edge cases require manual review.",
        "overlays": {},
        "riskFlags": [],
        "opportunities": []
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "n1",
      "target": "n2",
      "type": "relationship",
      "data": {
        "relationshipType": "informs",
        "description": "Applicant data from the form is used to assess eligibility.",
        "interoperabilityNote": "Submitted via API to the rules engine."
      }
    }
  ]
}
```

---

## Tips for good maps

- Aim for 10–25 nodes for a meaningful but readable map.
- Include a mix of node types — a map with only decisions or only execution nodes is probably missing something.
- Think about what information flows into decisions (evidence), what executes them (execution), and how people interact with the system (interfaces).
- Be precise about criticality — not everything is critical. Reserve 0.8+ for elements where failure would genuinely damage outcomes or trust.
- Use `notes` to flag assumptions or areas where public information is limited.
- Use `organisation` to capture cross-agency elements — this enables cross-boundary filtering in the app.
- Edges should be directed: they flow from source to target in the direction of information, control, or work.

---

## Schema reference

Full JSON Schema: `/schema.json`

This schema is designed to be machine-readable and includes detailed descriptions on every field. Read it before generating a map.
