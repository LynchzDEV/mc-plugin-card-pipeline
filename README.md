# Card pipeline — Mission Control plugin (KlangTech)

Takes one KlangTech ClickUp card. In about ten minutes the owner sees a Thai refinement comment in the owner's voice, subtasks labelled `[<repo>]` with Fibonacci hours (13 at most) on the latest AI sprint, and an English report for developers. The owner approves or edits; the session posts and reads back. Any answer the code, the old screen (backoffice) or production can give is looked up, never asked.

## The map

```
LANDS ──> INVESTIGATE + DECIDE + DRAFT ──> CHECK ──> APPROVE ──> SEND
session   project-manager (Opus)            script   session     session
          ├─ calls code-architect           + advisor
          └─ asks production-investigator     (silent by default)
└──────── reversible: runs alone ─────────────────┘  └── irreversible: waits for the owner ──┘
```

Reversible work runs without the owner. Nothing is written to ClickUp, code or production until the owner says yes on one screen. Every owner edit is saved as an example the next run reads.

## Roles

| Role | Runs as | Model | Produces | Never |
|---|---|---|---|---|
| session (LANDS, PROD, APPROVE, SEND) | the owner's Claude Code session, In Session flow steps, skill `card-refine` | — | the card folder, `prod.md`, the approval screen, ClickUp writes with readback | drafts the comment |
| project-manager | `agents/project-manager.md`, one per card | opus | ask list, verdict, Thai comment, subtasks with hours, English report, production questions | writes to ClickUp, runs production queries, edits code |
| code-architect | `agents/code-architect.md`, called by the project-manager | opus | `facts.md`: per ask, status, evidence `file:line`, repo, what exists today, the old screen, size signals; root cause for bugs | hours, Thai prose, questions to the owner |
| production-investigator | `agents/production-investigator.md`, called by the session | sonnet | `prod.md`: per question, status, query, result | anything but read-only SELECT; whole-table scans; more than 10 queries |
| refinement-advisor | flow step, cross-family | codex `gpt-6-astra` | at most 5 findings with evidence, or "no findings"; always pass | blocking, rewriting |
| scripts | `skills/card-refine/scripts/*.ts`, bun | — | `land.ts`, `lint.ts`, `score.ts`, `sprint.ts` | judging meaning |

## Install
Mission Control → **Marketplace** → *Install from a link* → `https://github.com/LynchzDEV/mc-plugin-card-pipeline` → tick **I trust this plugin** → Install. No settings.

Mission Control copies the three agents and the `card-refine` skill (with its scripts and examples) into every engine's config and lists the **Card pipeline** flow in Studio. Updating from 0.3.7 removes the old `biz-gate` agent.

### What it expects on your machine
- Mission Control with plugin API 2, and bun.
- The **clickup-board** plugin with the KlangTech board saved, and the ClickUp get-task / get-task-comments tools in your session.
- KlangTech repos under `~/klangtech`.
- The `inv-prod` skill and production access, for production lookups.

## Use
Run the **Card pipeline** flow in Studio with a card link, or say "refine `<card link>`" in a session. The session lands the card; the project-manager job investigates and drafts; production questions, if any, come back to your session (your permission prompt guards every production access); the advisor's findings and the lint output ride to one approval screen. Answer yes, edit, or "send back with: …". Only after yes does the session post the comment, set the sprint, create the subtasks and read everything back.

## What changed in 0.5.0
- `biz-gate` is replaced by `project-manager`, one author per card with two nested helpers: `code-architect` (code facts with file:line) and `production-investigator` (read-only production answers, called by the session so the owner's prompt guards it).
- Subtask labels are repo names from the registry (`[api]`, `[klangtech-army]`), never Old server / Domains / Army; every subtask carries the latest AI sprint.
- Every number in a comment comes from the card, the owner or the code, with its source in the report; requested scope is never dropped as ไม่ต้องทำ; an ASK-HUMAN first line never asks the team to confirm our own split.
- A script lints the comment (layout, every `ข้อ N` disposed, labels, Fibonacci hours, forbidden words); the project-manager runs it on itself.
- The cross-family advisor never blocks: its findings go to the owner's screen.
- Owner edits become examples (`skills/card-refine/examples/`) and estimate anchors the next run reads.
- The 12-node Contract Clerk (0.4.1) is discontinued: it verified text instead of meaning and blocked instead of surfacing. A single biz-gate-style author with the code in front of it is kept; one author with nested helpers was chosen over a chain of nodes so the investigation context is never handed between authors.

## Limitations
- The four answer keys in `examples/` prove regression only, not quality: four passes out of four give a lower bound near 51%.
- Quality is claimed from real cards: random `migrate-1` cards run through the flow to the approval screen, with the owner's approval as the label.

## Develop
`bun install --no-save && bun test` — checks the manifest with the SDK, the agents, the skill, the flow structure and the scripts.

## License
MIT
