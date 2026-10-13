# 2026-10-13: v0.4.1 "Contract Clerk" discontinued

Status: dump. This branch is kept as a record and is not shipped. The installed plugin stays at v0.3.7 (b84b254).

## What was built (2026-10-12 17:00 → 2026-10-13 10:00)

A twelve-node flow (`flows/card-pipeline.json`): LANDS → read-ledger → read-facts → voice → bench → check → critic → APPROVE → SEND → build-ready → complete, with repair-route between them. Supporting it, `skills/card-refine/scripts/` (clerk CLI, ledger, facts, values, raw-json, checker, corrections, publish, replay, build, workspace, snapshot, adapters) and a 59-row value contract (`docs/dump/v0.4.1/value-contract.md`) that binds every number in a comment to a typed token with an evidence id. 379 tests pass; 249 of 249 adversarial value scenarios pass.

## What it measured on real cards

| Sample | Cards | Reached APPROVE | Why not |
|---|---|---|---|
| 1 | 5 | 0 | keycap headings counted as digits; zero-slice approval crashed |
| 2 | 5 | 1 | subtask card threw at SEND; parent shape rejected; link line forced into a verbatim quote and deadlocked; critic repairs spent |
| 3 (partial) | 8 | 0 | 3 blocked by the critic after two repairs; 2 by quote deadlocks; 1 by a ledger defect; rest unfinished when the machine rebooted |

The four reference cards with owner-approved answer keys (14znf2fuv78, 14znf2futr8, 14znf2futry, 14znf2futhy) were never run with real workers and diffed against those keys. The "four-card replay" in the suite drives fixtures the builders wrote, so it proved the clerk accepts its own fixtures, not that the pipeline reproduces the owner's comment.

## Why it is discontinued

1. **It verifies text, not meaning.** The ledger makes every card line an obligation that must be quoted byte for byte in comment and design; the publishing rules then reject the same bytes (markdown links, sheet-row numbers, version names, emoji headings). The owner's approved comments paraphrase; the design made the owner's own style illegal.
2. **Four authors share one draft.** Ledger, investigator, voice and bench each own part of the text; a single check finding costs a full voice→bench→check cycle routed by a fifth agent, and the repair often lands in the wrong author. One author with the code in front of it did the job in one pass on 2026-10-12.
3. **Budgets block instead of surfacing.** Two checker repairs, two critic repairs, then phase blocked. Three sample-3 cards had a complete comment and a critic note; the owner never saw them.
4. **It guards against a problem corrected once.** One invented cost formula on fuv78 became a 59-row contract that never had to catch a real invented number in any sample, while rejecting "ยอดรวม" as a dangling qualifier.
5. **The tests measured the machine, not the output.** Every green run was true and irrelevant; gates kept being added to a pipeline whose actual output nobody had compared with the answer keys.

Net: nine hours, a pipeline that is excellent at proving it did nothing wrong and poor at producing a readable Thai draft on the owner's screen in ten minutes.

## What is worth keeping (small, cheap at run time)

- Real crash fixes found on real cards: subtask cards (`nestedSubtasksSupported` from the registry, evaluated at approval), ClickUp's bare-string `parent`, keycap headings not treated as values, zero-slice approval (`--graph-version 0`).
- The mechanical format checker (bold first line ending ครับ, business block, divider, dev bullets, two U+2063, ข้อ N coverage, [repo] labels, Fibonacci ≤13, sprint) — as a lint that reports to the owner, never as a gate.
- SEND with readback (`send-plan` / `record-send`) and the APPROVE screen.
- The owner's answer keys and corrections (`docs/dump/v0.4.1/reference/`), which are the only test that matters.

## The direction instead

Investigation first, format last. One author per card: classify (bug / change / question); for a bug find the root cause in code with file and line; for every item decide exists-already / where / which repo / what data; production questions go to inv-prod read-only, never to the owner; decide PASS / NEEDS-INFO / ASK-HUMAN from the evidence; write the comment last in the owner's voice; hours per repo from the scope found. Then a ten-line lint, then the owner's screen. Measure against the four answer keys before anything else.

## Owner rules (unchanged)

Bold first line ending ครับ; สรุป, or ต้นเหตุ / แผนแก้ on a bug; optional คำถาม; `---`; dev bullets; two U+2063. Never ask what the card, code or production can answer; never ask about priority or urgency. Never drop requested scope (ไม่ต้องทำ only for not-asked or proven-present). Never invent a price, policy or formula. Cite ข้อ N in order, every item and sub-item. Subtasks `[api]` / `[klangtech-army]` from the registry, Fibonacci ≤13, latest AI sprint; never `[Old server]` / `[Domains]`. Plain Thai; ไม่ต้องทำ never ไม่ต้องพัฒนา; แผนป้องกัน only with a concrete guard. English design names real repos.

## Where the artefacts are

- This branch (`dump/v0.4.1-contract-clerk`, tag `dump-v0.4.1-contract-clerk`): all code and tests, uncommitted until this record.
- `docs/dump/v0.4.1/`: value contract (recovered from the Mission Control step record), round-3 plan, owner brief, the four reference answer keys, Mission Control run records for runs 85d9c52d, 916ad44d, db4a6dd8, and the 15-card pool generator.
- Mission Control runs: b0dfb148, 85d9c52d, 916ad44d, 1547ee2d, db4a6dd8, dfe1a90e (all stopped or blocked).
- The owner's session export: `~/klangtech/2026-10-12-171826-httpsappclickupcomt384597414znf2fuv78.txt`.
