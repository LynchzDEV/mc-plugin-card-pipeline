# Card pipeline — Mission Control plugin

Refine ClickUp cards with the **biz-gate** agent: evidence first, a confidence gate before any verdict, and every draft shown to you before anything is posted. Then run the **Card pipeline** flow in Studio to take a card that passed from design review to a reviewed change.

| What | Status |
|---|---|
| `agents/biz-gate.md` — business gate for one card | Tuned on real cards |
| `skills/card-refine` — the procedure: evidence, biz-gate, draft, post on OK, sprint, estimate, read-back | Tuned on real cards |
| `flows/card-pipeline.json` — biz-gate → 3 design reviews in parallel → plan → verify plan → implement → cross-family review → report | **Only the business gate is tested.** The later steps run as written but have not been tried on a real card yet |

## What it needs
- Mission Control with plugin API 2 (plugins that contribute agents, skills and flows).
- The **clickup-board** plugin, with your board saved.
- Your team's **read-only production investigation** skill (named in your team file).
- A **team knowledge file**: your projects, business rules, comment language. It stays private on your machine; start from `examples/team-knowledge.example.md`.

## Install
1. Mission Control → **Marketplace** → install **Card pipeline**, or *Install from a link* with this repo's URL. Confirm the trust prompt: it lists the agent, skill and flow it adds.
2. Fill the settings:

| Setting | What to put |
|---|---|
| Team knowledge file | Absolute path to your private team file |
| Repos folder | Absolute path to the folder holding your team's repos |
| ClickUp workspace id | The number after `app.clickup.com/t/` in a card link |
| ClickUp board id | The saved board id in clickup-board (`mctl clickup boards`) |
| Planning field id | The custom field that holds the sprint |
| AI sprint pattern | e.g. `^Sprint (\d+) ?AI\b` |
| Comment footer | The last line of every bot comment |

Mission Control copies the agent and skill into each engine's config with these values filled in, and lists the flow in Studio.

### Until your Mission Control supports plugin API 2
Copy the files by hand:
1. `agents/biz-gate.md` → `~/.claude/agents/biz-gate.md`
2. `skills/card-refine/` → `~/.claude/skills/card-refine/`
3. In both copies, replace every `{{setting:<key>}}` with your value and `{{mc:mctl}}` with the command that runs your `mctl` (e.g. `bun <mission-control>/cli/mctl.ts`).
4. Start a new Claude Code session so it picks them up.

## Use
In a session: "refine `<card link>`". card-refine gathers the evidence, runs biz-gate, and shows you the verdict, confidence, checks and the exact comment. Nothing is posted until you say so.

## Develop
`bun install && bun test` — checks the manifest with the SDK, that every `{{setting:…}}` is a declared setting, that the flow is well formed, and that no team-private data is in the shipped files.

## License
MIT
