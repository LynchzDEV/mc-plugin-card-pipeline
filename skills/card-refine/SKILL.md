---
name: card-refine
description: Use when asked to refine, gate or check readiness of ClickUp cards ("refine this card", a pasted card link). Drives the project-manager flow for each card (land the card folder, answer its production lookups, show the owner one approval screen, send the approved comment and subtasks to ClickUp and read them back) and runs the rehearsal loop against the answer keys.
---

# card-refine

The session's manual for the card pipeline. The `project-manager` agent investigates, decides and drafts; the session lands the card, answers production questions, shows the owner one screen, and writes to ClickUp only after the owner says yes. Steps 2, 4, 5 and 6 are the session nodes of the `card-pipeline` flow; step 3 runs as a flow job.

## 1. Prerequisites
Stop and name what is missing:
- The clickup-board plugin answers: `{{mc:mctl}} plugin call clickup-board boards.list --json`.
- The `inv-prod` skill is installed (production lookups, step 4).
- Mission Control is running (the flow and its project-manager job).
- The ClickUp get-task and get-task-comments tools are available in this session.

## 2. LANDS
For each card:
1. Fetch the task with the ClickUp get-task tool (`include`: description, custom_fields, attachments, subtasks, linked_tasks) and its comments with get-task-comments.
2. Save them as `task.json` and `comments.json` under `~/.cache/card-pipeline/cards/<card-id>/` (durable, never /tmp, never inside a repo).
3. Run `bun ~/.claude/skills/card-refine/scripts/land.ts --task ~/.cache/card-pipeline/cards/<card-id>/task.json --comments ~/.cache/card-pipeline/cards/<card-id>/comments.json --out ~/.cache/card-pipeline/cards/<card-id>/`.
4. Write `related.md` into the card folder with two parts. **Siblings:** the other open cards that share this card's tags (ClickUp filter by tag, same list): `- <name> (<id>) — <status>` per card, excluding this card; `none` when there are none. **Existing work:** search the same list for cards of any status (open, review, post review, closed) whose title or description matches 2–3 keywords from this card's title (the screen or feature noun: ลูกค้า, Customer, คิวขุด, Kood, KToken, Export …; ClickUp search or filter_tasks with include_closed), and list each hit the same way with its status and last-updated date; `none` when nothing matches. The project-manager treats a hit that already covers the ask as a duplicate (R5) and a hit that already built it as verification only (1 hour).
5. Open every file in `shots/` yourself; a `.missing` file means the download failed twice.
6. Report pass with the card folder path as evidence.

## 3. PROJECT-MANAGER
When several cards were handed over together, every card is landed and refined before any card reaches APPROVE or SEND, so the packages can name each other. A flow node, not the session. The job runs the `project-manager` agent with:
- `--card ~/.cache/card-pipeline/cards/<card-id>/` (the folder from the LANDS evidence; `prod.md` inside it when present),
- `--examples ~/.claude/skills/card-refine/examples`,
- `--registry ~/.claude/skills/card-refine/scripts/repo-registry.json`,
- `--architect ~/.claude/agents/code-architect.md`.

It returns the output block (VERDICT … LINT) and leaves `facts.md`, `comment.md`, `subtasks.json`, `prod-questions.md`, `lint.txt` and `package.md` in the card folder.

### Lookup tools (in `scripts/`, next to the registry)
The project-manager and code-architect run these instead of deciding by prose:
- `where.ts` — which repo owns a table or column for a system word, with its time columns: `bun scripts/where.ts --word <vayu|hermez|order_import…> --repos-root ~/klangtech --registry scripts/repo-registry.json [--json]`
- `anchor.ts` — one anchor per piece of work, summed into the Fibonacci bucket for one outcome (the card, or a business-value child): `bun scripts/anchor.ts --anchors examples/anchors.md --parts "<piece 1> | <piece 2>" [--repo <name>]` (or `--title "<text>" [--top 5]` for the nearest rows of one title)

## 4. PROD-LOOKUPS
- Read `PROD-QUESTIONS` in the package. `none`: report pass with evidence "no production questions".
- Otherwise spawn `production-investigator` (Agent tool) with `prod-questions.md` and the card folder. It writes `prod.md`; its production access raises the owner's permission prompt in this session. Report fail with summary "new facts in prod.md" so the project-manager runs again (at most 3 project-manager visits per card).
- Limits: read-only SELECT with `SET statement_timeout = '10s'`, one seller/page/record per query, at most 10 queries per card.
- A blocked query is recorded once in `prod.md` and never retried.

## 5. APPROVE
Show the owner one screen per card:
- verdict and confidence,
- the comment exactly as it would be posted (`comment.md`),
- the subtasks, each with its business outcome, repo label, hours and sprint, or none when the card is one outcome,
- the refinement-advisor findings (or "no findings"),
- the lint output (`lint.txt`),
- the path of `package.md` for the full report.

The owner answers one of three:
- **yes**: go to SEND.
- **edit** (the owner changes the text): first write `examples/<card-id>.md` with the approved text and add a row to `examples/corrections.md` (date | card | shown | edited | rule), then SEND the edited text.
- **send back with: <note>**: first add the `corrections.md` row, then run the project-manager once more in this session with the note, and show the new screen.

NEEDS-INVESTIGATION is never shown for approval and never posted; step 4 handles it.

## 6. SEND
Only after the owner's yes, and only when every card of the batch has an approved package (the owner reads them together; a sibling learnt from a later card changes the earlier package before anything is posted). One comment per card: never a follow-up post, never a separate question post, never a correction post. In this order:
1. Post the comment, or replace our own earlier comment in place: one containing two U+2063 characters (adjacent or not), or ending with an old footer "[🤖 Biz ยังไม่ต้อบตอบ อันนี้บอทจ้า]" or "[🌚Biz ยังไม่ต้อบตอบ อันนี้บอทจ้า]". Several candidates: replace the newest and show the others to the owner. Never post a second copy; never overwrite any other bot or person's comment.
2. Before writing children, verify each proposed subtask: `summary` is one independently useful business outcome, and `hours` is a Fibonacci estimate (1, 2, 3, 5, 8 or 13). A repository, a layer or a dev note is not that outcome. Do not create a proposed child that fails this check, and report it. Do not delete subtasks already on the card.
3. PASS with approved children: read the card's existing subtasks; update the one with the same title, create only the missing ones, each named `[<repo>] <title>` with Time estimate = hours × 60 minutes. Clear the parent's estimate only when those children were written. PASS without subtasks and a numeric ESTIMATE: set the card's Time estimate and create no children. Any other verdict: create no subtasks and leave estimates untouched.
4. PASS, NEEDS-INFO and ASK-HUMAN: after step 3, set Planning (custom field `1769d214-d88b-413e-b56c-45fb86f454cb`) to the latest AI sprint on the card and on every subtask, including the ones step 3 just created. Read the option live: `{{mc:mctl}} plugin call clickup-board board.load --params '{"boardId":"<board id>"}' --json` → `fields` → "Planning" → `options`, with the board id from `{{mc:mctl}} plugin call clickup-board boards.list --json` (the saved board whose folder is `~/klangtech`, or the only one). STOP: leave Planning unchanged.
5. A card whose `fields.json.parent` is set is already a child of another card. Keep its estimate on itself when the package has one outcome. Create further children only when step 2 accepted them. Report the readback.
6. Read everything back and report what saved: the comment present once with the two U+2063 characters, Planning on the card and on each subtask, the subtasks and their estimates. A partial write is reported from the readback. A child that failed the business-value check is named here and is not on the card.

## 7. REHEARSAL
The G1 loop, owned by the session. Nothing is posted.
1. For each card with a key, the examples dir is `examples/` minus the card under test: copy it to `~/.cache/card-pipeline-v050/examples-minus/<card-id>/` and delete `<card-id>.md` there.
2. Run the project-manager as a subagent: `subagent_type: project-manager` when installed, otherwise `general-purpose` with `model: opus` and a prompt that begins "Read and follow exactly `<worktree>/agents/project-manager.md`". Pass `--card` (the landed folder), `--examples` (the copy from 1), `--registry <worktree>/skills/card-refine/scripts/repo-registry.json`, `--architect <worktree>/agents/code-architect.md`. All four cards run in parallel.
3. Run `lint.ts` on its `comment.md`, then `bun <worktree>/skills/card-refine/scripts/score.ts --package <card-dir>/package.md --card <card-dir> --key ~/.cache/card-pipeline-v050/keys/<card-id>.md --judge "codex exec --skip-git-repo-check -s read-only -m gpt-6-astra" --out <round-dir>/score.json`.
4. Store `package.md`, `score.json` and the subagent transcript path under `~/.cache/card-pipeline-v050/rounds/<n>/<card-id>/`.
5. Write a misses table: card | dimension | lost points | the judge's evidence | the change for the next round.
6. Allowed changes between rounds: the project-manager prompt, an example, an anchor, the lint. Forbidden: any new gate or node.
7. Every round runs all four cards on the same prompt, including the ones already at 100: a rule that fixes one card can break another, and a card that regresses is a finding like any other. Change the prompt only between rounds. The gate is two consecutive full rounds with every card ≥90 and no prompt change in between; cap 8 rounds, then report what remains with the per-item misses. Read the transcripts whenever a score moves.

### Loop scripts (shipped in `scripts/loop/`)
Set `CARD_PIPELINE_ROOT` (the plugin checkout) and optionally `CARD_PIPELINE_LOOP` (the durable loop dir, default `~/.cache/card-pipeline-loop`, holding `keys/`, `examples-minus/`, `rounds/`). Then:
- `scripts/loop/round-run.sh <round> [card …]` runs the project-manager headlessly (`claude -p`, Opus) on every card in parallel, archives each card's outputs under `rounds/<round>/<card>/`, and scores them (`JUDGE_RUNS=3`).
- `scripts/loop/round-score.sh <round> [card …]` scores already-archived packages and prints the table plus every judge item that was not yes.
- `scripts/loop/round-archive.sh <round> <card>` moves one finished card's outputs into the round dir and frees the card folder.
- `scripts/loop/loop-status.sh` prints the rounds × cards matrix.
Freeze the prompt per round (the runner copies `agents/project-manager.md` into the round dir); change prompts or examples only between rounds.

## 8. Report
A table: card (linked by name), verdict, confidence, approved / edited / sent back, estimate or subtask hours, sprint, and anything that did not save or stopped at a limit.
