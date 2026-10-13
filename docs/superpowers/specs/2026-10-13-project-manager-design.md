# Project Manager — card-pipeline v0.5.0 design

Status: draft for the owner's review, 2026-10-13. Replaces biz-gate (v0.3.7) and the discontinued Contract Clerk (v0.4.1, see `docs/decisions/2026-10-13-discontinue-contract-clerk.md`).

## 1. Goal, in the owner's words

One KlangTech ClickUp card in. On the owner's screen, within ~10 minutes: a Thai refinement comment in the owner's voice, subtasks named `[<repo>]` with Fibonacci hours (≤13) on the latest AI sprint, and an English report for developers. The owner approves or edits, the session posts and reads back. Every answer that the code, the old screen (backoffice) or production can give is looked up, never asked.

Success is measured on output, never on the machine:

| Gate | Set | Bar |
|---|---|---|
| G1 regression | 4 reference cards with owner-approved keys: 14znf2fuv78, 14znf2futr8, 14znf2futry, 14znf2futhy | every card scores ≥95 on the rubric in §9, two runs each |
| G2 real cards | 5 random `migrate-1` cards (not the 4 above) run through the real flow to the APPROVE screen | rubric-without-key ≥90 on each, and the owner approves with at most small edits |
| G3 ship | plugin v0.5.0 installed through Mission Control | `bun test` green, flow validates, one live card end to end |

4 keys prove regression, not quality (4/4 passes give a 95% lower bound near 51%). G2 is where the quality claim comes from; the loop keeps running on later cards.

## 2. What the last two attempts taught

- 2026-10-12 afternoon: one Opus agent (biz-gate) with the code in front of it produced postable comments for 4 cards in 2–6 minutes each. Its mistakes were prompt-level: `[Old server]` labels, subtasks without the sprint, one invented cost formula, a requested button dropped as ไม่ต้องทำ, questions to the team about our own split.
- 2026-10-12 night: a 12-node clerk pipeline that verified text instead of meaning, split one draft across four authors, blocked instead of surfacing, guarded against one corrected mistake with 59 rules, and tested fixtures instead of output. 0 of 18 sampled cards reached the owner.
- The value is in the investigation: root cause with file and line, what already exists, which repo, what the old screen did. The comment is the last five minutes.

## 3. The map

```
LANDS ──> INVESTIGATE + DECIDE + DRAFT ──> CHECK ──> APPROVE ──> SEND
session   project-manager (Opus)            script   session     session
          ├─ calls code-architect           + advisor
          └─ asks production-investigator     (silent by default)
└──────── reversible: runs alone ─────────────────┘  └── irreversible: waits for the owner ──┘
```

Reversible work runs without the owner. Nothing is written to ClickUp, code or production until the owner says yes on one screen. Every owner edit is saved as an example the next run reads.

## 4. Roles, models, views

| Role | Runs as | Model | Sees | Produces | Never |
|---|---|---|---|---|---|
| **session** (LANDS, PROD, APPROVE, SEND) | the owner's Claude Code session, In Session flow nodes | — | ClickUp tools, the owner | `card.md` with numbering and item-keyed screenshots, `prod.md`, the APPROVE screen, ClickUp writes with readback | drafts the comment |
| **project-manager** | plugin agent `agents/project-manager.md`, one per card | opus | card folder, examples, repos (read-only), facts from the architect, `prod.md` if present | ask list, verdict, Thai comment, subtasks + hours, English report, prod questions | writes to ClickUp, runs production queries, edits code |
| **code-architect** | plugin agent `agents/code-architect.md`, called by the PM (nested subagent) | opus in v1, sonnet tried in the loop | the ask list and `~/klangtech` repos; `backoffice` as the reference | `facts.md`: per ask, status OK/UNKNOWN, answer, evidence `file:line`, repo, exists-today, old-screen path, size signals; root cause for bugs | hours, Thai prose, questions to the owner, reading the comment template |
| **production-investigator** | plugin agent `agents/production-investigator.md`, called by the **session** (ssh needs the owner's permission prompt) | sonnet | `prod-questions.md`, the `inv-prod` skill | `prod.md`: per question, status OK/FAILED/UNKNOWN, result, query | anything but SELECT/read; whole-table scans; more than 10 queries |
| **refinement-advisor** | flow node, cross-family | codex `gpt-6-astra` | `card.md`, `facts.md`, the PM package | ≤5 findings with evidence, or "no findings"; always outcome pass | blocking, rewriting, repair budgets |
| **scripts** (no model) | `skills/card-refine/scripts/*.ts`, bun | — | files | `land.ts`, `lint.ts`, `score.ts`, `sprint.ts` | judging meaning |

Why one author with nested helpers, not a chain of nodes: the author keeps its investigation context and can ask the architect a follow-up; each helper returns ≤2k tokens of facts; nothing is handed between authors. Verified 2026-10-13: a Claude Code subagent can spawn a subagent and receive its result.

Why the investigator is called by the session, not the PM: `ssh prod-kt` triggers the prod-ssh-access-guard permission prompt, which only the owner's session can answer. Headless jobs would hang or be denied.

Why the advisor never blocks: three sample-3 cards died blocked with a complete comment and a critic note the owner never saw. Findings belong on the APPROVE screen, where the owner decides in one line.

## 5. project-manager protocol (investigation first, format last)

Inputs: `<card-dir>/card.md` (from `land.ts`: title, Log Type, numbered description with `ข้อ N` kept, screenshot files `shots/<item>-<n>.png` in description order, human comments only, linked cards by name, Planning options), `<examples-dir>/` (approved comments, the card under test excluded), `repo-registry.json`, optional `prod.md`.

1. **Read everything.** Open every screenshot; a red box or arrow answers "where". Classify: bug / change request / question / empty (R2). Build the ask list: one line per numbered item (and sub-item) or per sentence of an unnumbered card; for each, what must be true to decide it.
2. **Investigate.** Call code-architect once with the whole ask list; at most one follow-up call for UNKNOWNs that change the verdict or the hours. Read the files it cites yourself before relying on a root cause. Never speculate about code you have not opened.
3. **Production.** Write `prod-questions.md` only for keyed, bounded facts that the code cannot settle and that change the verdict or hours (one seller/page/record, a stated window). With no `prod.md`, decide from the code and write "not verified in production" in the REPORT, never a question to the owner. If a question is decisive, end `NEEDS-INVESTIGATION`; the session answers it and runs you again.
4. **Decide** with the owner rules (unchanged from biz-gate, kept verbatim in the agent): look it up, never ask; R1 fast-track, R5 duplicate, R4 dropped, R2 empty, R3 genuine business decision, R7 revenue path, R8 split >13h, R9 label note; confidence A/B/C gate; never question priority or urgency; never drop requested scope (a broken old button is work); never invent a price, policy or formula; parity with ของเดิม (backoffice) is a decision, stated as one.
5. **Write last.** Read the 2–3 most similar examples (same shape: bug / numbered CR / split). Thai comment in the fixed layout; subtasks `[<repo>]` from the registry, Fibonacci hours anchored on `examples/anchors.md` (past approved subtasks with hours); English report with sources and the retrieval status of every lookup.
6. **Lint yourself.** Run `lint.ts` on the comment; fix; at most 3 passes. Attach the final lint output to the report. No other self-verification, no "double-check" subagents.
7. **Output** the fixed block: VERDICT, CONFIDENCE, CHECKS, RULES, PROJECT, SYSTEM, SPRINT, ESTIMATE, COMMENT, SUBTASKS, REPORT, PROD-QUESTIONS, LINT.

Changes versus biz-gate's prompt, each tied to a correction: labels are repo names from the registry (`[api]`, `[klangtech-army]`), never `[Old server]`/`[Domains]`/`[Army]`/`[ระบบเดิม]`; every subtask carries the latest AI sprint; numbers in the comment come only from the card, the owner's comments, or code, each with its source in the REPORT; a requested action that exists on the old screen but not today is work with hours, never ไม่ต้องทำ; the ASK-HUMAN first line never asks the team to confirm our own split; `ข้อ N` in order, every item disposed once.

## 6. code-architect contract

Frontmatter: `model: opus`, `tools: Read, Grep, Glob, Bash`, `omitClaudeMd: true`, `maxTurns: 80`. Input: the ask list, the repos root, the registry. Output, Markdown, ≤2,000 tokens:

```
## Facts
- ask 3 | status: OK | repo: klangtech-army | exists today: no | old screen: backoffice/src/sections/.../list-view.tsx:679 | evidence: app/views/army/customers/index.html.erb:1-60 (no search field), app/queries/army/customers/list_query.rb:12 (filter, segment_id, page_id only) | size: new query param + view field + export passthrough (3 call sites)
- ask 7 | status: UNKNOWN | what would settle it: whether tenant S02570 has HerMEZ Pro (production setting)
## Root cause (bug cards only)
- file:line and the mechanism, or UNKNOWN with what was searched
## Repos touched
- klangtech-army (screen, query), api (host hook at config/initializers/army.rb)
```

Rules: read-only; `Bash` for `git log`, `rg` and `ls` only; `backoffice` is the reference for how a screen used to work; cite a line for every fact; UNKNOWN is a valid answer and better than a guess; no Thai, no hours, no opinions on priority.

## 7. production-investigator contract

Frontmatter: `model: sonnet`, `tools: Bash, Read`, `skills: inv-prod`, `omitClaudeMd: true`, `maxTurns: 40`. Input: `prod-questions.md`. Output `prod.md`: per question `status: OK | FAILED | UNKNOWN`, the exact read-only query, the result, the host. Limits from inv-prod and card-refine: SELECT only, statement timeout 10s, one seller/page/record per query, ≤10 queries per card, a blocked query recorded once and never retried. Called by the session at the PROD step; its permission prompts surface in the owner's session.

## 8. refinement-advisor contract (flow node, codex)

Reads `card.md`, `facts.md`, the PM package. Checks only the hard-fail list: a number, price, policy or formula with no source in card/owner words/code; a numbered item dropped or disposed twice; a question the code or a screenshot answers; a question about priority or urgency; a `[label]` not in the registry; requested scope marked ไม่ต้องทำ without proof it exists or was not asked; ต้นเหตุ not supported by the cited evidence. Output: ≤5 findings, each with the evidence, or the single line "no findings". Always ends pass; the findings ride to the APPROVE screen. Effort cap: one pass, no loop.

## 9. Script layer (no model)

- `land.ts <task.json> <shots-dir>`: takes the ClickUp task JSON the session fetched (with `markdown_description`, `attachments`, `custom_fields`), writes `card.md` keeping the numbering and placing each image reference as `shots/<item>-<n>.png`; downloads the images referenced in the description in item order (ClickUp's `attachments[]` records carry no URL, so attachments that are not referenced in the description are listed by title only); drops AI/bot comments (two U+2063, old footers, AI triage format); resolves Log Type and lists Planning options. Why: the mctl dossier strips numbering and image order, which broke `ข้อ N` citations.
- `sprint.ts <planning-options.json>`: the highest `Sprint <n>AI` / `Sprint <n> AI` option (id, label).
- `lint.ts <comment.md> --items <n> [--subtasks <json>]`: mechanical checks only, from v0.4.1's checker with the ledger parts removed: bold first line ending ครับ and matching a verdict; business block headings; ≤2 question bullets; blank/`---`/blank; dev bullets; prose lines end ครับ; two U+2063 at the end; `ข้อ 1..n` each disposed once, ascending inside a block; labels from the registry; Fibonacci ≤13; no ไม่ต้องพัฒนา, no priority words, no file paths or type names, no personal data, one link per card, ≤15 lines. Exit 1 with findings; the PM fixes.
- `score.ts <package.md> --key <key.md> | --no-key`: see §10.
- `repo-registry.json`: carried over from v0.4.1 (`nestedSubtasksSupported: false`).

## 10. Measurement: rubric, judge, loop

Reference-guided checklist, binary items, paraphrase allowed, 0–100, cross-family judge (codex `gpt-6-astra`), each item scored in isolation with an `unknown` option, two passes with items shuffled, averaged.

| Dimension | Points | Check |
|---|---|---|
| Verdict and first line | 25 | same verdict class as the key |
| Key facts recalled | 25 | share of the key's atomic claims (cause, what exists, where, decisions) stated with the same meaning |
| Item coverage | 15 | share of numbered items disposed the same way as the key (work / ไม่ต้องทำ / question) |
| Subtasks | 15 | same count ±0, same repo labels, same intent |
| Precision | 10 | share of the draft's claims supported by the key or by cited evidence |
| Estimate | 10 | total within one Fibonacci bucket of the key: 10; two buckets: 5 |

Hard fails (score 0): wrong verdict; a number/policy/formula with no source; wrong repo label; a question the code or screenshot answers; any priority or urgency question; a numbered item silently dropped; requested scope marked ไม่ต้องทำ that the key keeps; not Thai; more than 2× the key's length. The format-type hard fails run in `lint.ts` (script), the semantic ones in the judge.

Without a key (G2), the judge scores the same dimensions against `card.md` + `facts.md` instead of a key (coverage, precision, grounding of every number), and the owner's APPROVE decision is recorded as the final label.

Calibration first: the judge must score each owner key against itself at 100 and the 2026-10-12 first drafts (with their known mistakes) below 95. If it does not, fix the judge before touching the PM.

Loop (G1): run the PM on all 4 cards in parallel (examples exclude the card under test) → `lint.ts` → `score.ts` → misses table → change the PM prompt, an example, an anchor, or the lint (never a new gate) → rerun only the cards under 95 → until all 4 ≥95 on two consecutive runs. Cap 6 rounds; after that, report what remains with the per-item misses. Every round's packages and scores are kept under `~/.cache/card-pipeline-v050/rounds/<n>/` (durable, not /tmp). Read the transcripts whenever a score moves.

G2: 5 random `migrate-1` cards through the real Mission Control flow (§11) to the APPROVE screen, judge-without-key, owner approves or edits; edits become examples; posting happens only on the owner's yes. Then the plugin ships.

## 11. Flow `flows/card-pipeline.json`

```
lands (session, task) → project-manager (claude/opus, task) → prod-lookups (session, task)
   prod-lookups ──fail (new facts in prod.md)──> project-manager   (maxVisits 3)
   prod-lookups ──pass──> refinement-advisor (codex, task, role review) → approve (session, task) → send (session, task)
```

- `lands`: the session fetches the task (ClickUp get-task with description, attachments, custom fields), runs `land.ts`, writes the card folder, reports pass with the folder path as evidence.
- `project-manager`: the job runs the plugin agent on the card folder (nested calls to code-architect allowed) and returns the output block verbatim. Pass when the block is complete; blocked only on a script error.
- `prod-lookups`: if `PROD-QUESTIONS` is empty, pass immediately. Otherwise the session runs production-investigator, writes `prod.md`, reports fail so the PM runs again with the facts.
- `refinement-advisor`: as §8; always pass.
- `approve`: one screen: verdict, confidence, the comment exactly as it would be posted, subtasks with hours and sprint, advisor findings, lint output, link to the report. Owner says yes, edits, or "send back with: …" (one PM rerun in session with the note). An edit or a send-back is saved as an example/correction before anything else happens.
- `send`: post or replace our earlier comment (two U+2063 or old footer), set Planning to the latest AI sprint on the card and every subtask, create or update subtasks by title with hours, clear the parent estimate when subtasks exist, read everything back. Partial write reported from the readback.

Node `skills` entries point at `~/.claude/skills/card-refine/SKILL.md` (installed by the plugin). `send` and `approve` instructions live in the skill, with `{{mc:mctl}}` for the mctl path.

Rehearsal mode (used by the G1 loop): `lands` from a saved task JSON; `approve` runs `score.ts` instead of asking; `send` is skipped. Same agents, same files, so the rehearsal measures the product, not a fixture.

## 12. Correction memory

`skills/card-refine/examples/<card-id>.md`: the approved comment, the subtasks with labels/hours/sprint, and a one-line "why approved / what was edited". Seeded with the 4 keys. Every APPROVE with an edit appends the before→after pair to `examples/corrections.md` and updates the example. `examples/anchors.md`: subtask → hours table from approved cards, read by the PM for estimates. Retrieval is by shape (bug / numbered CR / split / parity gap), at most 3 examples per run.

## 13. Ship

- Plugin v0.5.0: `agents/project-manager.md`, `agents/code-architect.md`, `agents/production-investigator.md`; `skills/card-refine/` (SKILL.md, scripts, examples, repo-registry.json); `flows/card-pipeline.json`; tests (`bun test`): manifest, contributed paths, agent frontmatter, flow validates against the SDK rules, lint fixtures (the 4 canonical keys pass lint; the raw 2026-10-12 first drafts fail lint on shape; synthetic one-edit fixtures fail with the expected codes), `land.ts` on the saved futhy JSON keeps 14 numbered items, the 15 description images in item order and lists the one unreferenced attachment by title, `score.ts` key-vs-key = 100 with a deterministic judge stub (the real Codex judge is calibrated in Phase 2).
- `biz-gate.md` is removed from the manifest; the installed copy is replaced on update (Mission Control removes files it installed).
- Land from the worktree: rebase on `origin/main`, push `HEAD:main`, tag `v0.5.0`, then `mctl plugin update card-pipeline --ref v0.5.0 --yes --accept --trust`.

## 14. Approaches considered

1. **Cut-down biz-gate alone** (one agent, no helpers): fastest; proven to produce postable text; but a 14-item card plus repo reading overflows one context, and no separation keeps production access behind the owner's prompt. Rejected as the end state, kept as the fallback if nesting misbehaves.
2. **PM + nested helpers + script lint + cross-family advisor that never blocks** (this design): one author, compact facts, safety boundary on production, visible in the cockpit as one PM node, measured only on output. Chosen.
3. **Flow-level pipeline with one node per role** (v0.4.1 shape): maximal cockpit visibility; but every handoff loses the author's context and every node is a place to block. Rejected.

## 15. Assumptions the owner should correct

- "Those 4 cards" are the four with answer keys: fuv78, futr8, futry, futhy (86d4cxz32 no longer exists).
- ">90% of migrate-1" is measured on 5 random cards first, with the owner's APPROVE decision as the final label; the remaining 20 follow the same path later.
- Posting to ClickUp, pushing the plugin and installing it all wait for the owner's explicit yes, even inside the loop.
- `[api]` and `[klangtech-army]` style labels, subtasks on the latest AI sprint, hours per subtask with no parent hours: carried over as settled rules.
- The judge is codex `gpt-6-astra` (cross-family). Fable as a Claude Code advisor for the PM is a later lever, not in v1.
