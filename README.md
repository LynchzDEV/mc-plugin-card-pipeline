# Card pipeline — Mission Control plugin (KlangTech)

Ready to use, no setup. Refine KlangTech ClickUp cards with the **biz-gate** agent: evidence first, a confidence gate before any verdict, today's business rules and comment format built in. Comments the gate is sure of (HIGH confidence) are posted on their own; everything else is shown to you first. Then run the **Card pipeline** flow in Studio to take a card that passed from design review to a reviewed change.

| What | Status |
|---|---|
| `agents/biz-gate.md` — business gate for one card | Tuned on real cards |
| `skills/card-refine` — the procedure: evidence, biz-gate, post HIGH on its own and show the rest, latest AI sprint, Fibonacci estimate, read-back | Tuned on real cards |
| `flows/card-pipeline.json` — biz-gate → 3 design reviews in parallel → plan → verify plan → implement → cross-family review → report | **Only the business gate is tested.** The later steps run as written but have not been tried on a real card yet; the Grok step needs a Grok connection |

## Install
Mission Control → **Marketplace** → *Install from a link* → `https://github.com/LynchzDEV/mc-plugin-card-pipeline` → tick **I trust this plugin** → Install. That's all: no settings.

Mission Control copies the agent and skill into every engine's config and lists the flow in Studio. Uninstall removes exactly what it added.

### What it expects on your machine
- Mission Control with plugin API 2.
- Access to this private repo on GitHub.
- The **clickup-board** plugin with the KlangTech board saved.
- KlangTech repos under `~/klangtech`.
- The `inv-prod` skill and production access, for production checks on bug cards (card-refine stops and says so if it is missing).

## Use
In a session: "refine `<card link>`". card-refine gathers the evidence and runs biz-gate. A HIGH-confidence comment is posted straight away; a MEDIUM or LOW one is shown to you with the verdict, confidence and checks, and posted only when you say so. Then it moves the card to the latest AI sprint, sets the estimate and reads the card back.

Every comment has the same shape: a bold first line, a short business block (ต้นเหตุ / แผนแก้ / แผนป้องกัน on a bug, สรุป otherwise), `***`, the dev bullets with the Fibonacci estimate, and at most two questions under **คำถาม**. There is no visible bot footer; the comment ends with two invisible characters so the gate can find and replace its own comment next time.

## Develop
`bun install && bun test` — checks the manifest with the SDK, that the plugin needs no settings and no machine-specific paths, and that the flow is well formed.

## License
MIT
