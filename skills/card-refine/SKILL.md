---
name: card-refine
description: Use when asked to refine, gate or check readiness of one or more ClickUp cards ("refine this card", "run biz-gate on …", a pasted card link). Gathers the evidence, runs the biz-gate agent per card and answers its production lookups with inv-prod, posts HIGH-confidence PASS/STOP comments without questions on its own and shows every other draft for approval, moves the card to the latest AI sprint, sets the Fibonacci estimate and reads the card back.
---

# card-refine

Runs the biz-gate agent on ClickUp cards the way it was tuned: evidence first, every answer looked up in the code or production instead of asked, only proven (HIGH) PASS/STOP comments without questions posted on their own, everything else shown to the user first, and every write read back.

## 1. Check prerequisites (stop and name what is missing)
- The clickup-board plugin answers: `{{mc:mctl}} plugin call clickup-board boards.list --json`.
- A board is saved in clickup-board: `{{mc:mctl}} plugin call clickup-board boards.list --json` (the saved board whose folder is `~/klangtech`, or the only one).
- The `inv-prod` skill (read-only production investigation) is installed. If production cannot be reached, keep going: cards that need production end as drafts shown to the user (step 5), never as questions.

## 2. Gather the evidence, one folder per card
For each card, in `<scratch>/cards/<card-id>/` (never shared between cards, never inside a repo):
- `card.md`: `{{mc:mctl}} plugin call clickup-board source.item --params '{"id":"<card-id>"}' --json` → `contextMarkdown`.
- Every screenshot: number them in the order their image links appear in the card's description, which the card text above does not keep (it lists them under Attachments in a different order). Read the description with the ClickUp get-task tool (`markdown_description`, one call per card), then `curl -sS -o <n>.png '<url>'` in that order, plus any attachment not in the description after them. Open each one yourself and note what it shows.
- Bug card (Log Type 🐛Bug/🦋SuperBug, or BUG/🐛 in the title) that names a seller code, page or record id: run `inv-prod` yourself for it and write what you found to `prod.md`: what was searched, where, and the results, including what could not be read. No such key: skip production here and let biz-gate list the lookups it needs.

Production queries, every time you run `inv-prod` (step 2 or step 3):
- Read-only, one card at a time across all cards, one query at a time, each with a statement timeout (e.g. `SET statement_timeout = '10s'`).
- Keyed and bounded: one seller, page, setting or record id; a count or average only for one seller or one page over a stated time window with a LIMIT. Never a whole-table count, a scan across all sellers, a log-wide read, or EXPLAIN ANALYZE.
- At most 10 queries per card. A blocked or failed query is written to `prod.md` as blocked and never retried in the same run.

## 3. Run biz-gate
One agent per card, cards in parallel. Give each its card folder and tell it to use those files, not to download images again and not to query production.
- NEEDS-INVESTIGATION: run each listed prod lookup that is not already in `prod.md` (step 2 limits apply), add the results to `prod.md`, and run biz-gate again for that card.
- At most 3 biz-gate runs per card in all (step 3 and step 4 reruns together), and each rerun must bring new evidence or name the specific defect to fix. A lookup already answered or blocked is never run again. Still NEEDS-INVESTIGATION, or a step 4 check still failing, after the third run: stop that card, write nothing to it, and show the user the draft and what is missing.

## 4. Check the result before posting or showing it
- Layout, every card: bold first line ending ครับ; the business block (bug PASS: bold ต้นเหตุ / แผนแก้ / แผนป้องกัน; any other card: bold สรุป with one or two lines); then, only if there are questions, bold คำถาม and at most 2 question bullets; an empty line, `---`, an empty line; dev bullets with facts only; no footer line; prose lines, questions and the last dev bullet end with ครับ (bold headings do not), and the last dev bullet then ends with two U+2063 characters (the real characters, not the text "<U+2063>"). Aim for 12 lines and 5 bullets; the required blocks and covering every numbered item come first. Another card linked once by its name.
- Every card: the comment never says "ไม่ต้องพัฒนา", and no sentence questions the card's priority, urgency, Urgent or a deadline.
- Numbered card: list the description's item numbers, then check the comment: every mention of an item starts with "ข้อ <n>"; inside each block the cited numbers go up line by line and question by question, and groups are ordered by their lowest number; each number has exactly one disposition — one work group "(ข้อ a, b, c)" or work line "ทำข้อ …", or "ไม่ต้องทำ", or waiting on a question. An item mentioned twice (explained and asked about) is fine. Any number missing, with two dispositions, or out of order: run biz-gate again with the list of what is wrong.
- Every question: open each place listed under "questions searched" in the REPORT and keep the question only when those places were read and do not hold the answer. A question that checks the agent's own proposal, that the old screen (`backoffice` / old Portal) answers, or that the code or production answers: look it up (the code yourself, production with `inv-prod` under the step 2 limits) and run biz-gate again with the answer.
- CONFIDENCE matches CHECKS: no PASS or hours unless A, B and C are all yes with evidence.
- Every estimated part of the fix is tied to the evidence in A; nothing "nice to clean up" carries hours.
- If a check looks wrong (e.g. the agent read the wrong screenshots), fix the evidence and run it again; never pass it on.

## 5. Post HIGH, show the rest
- CONFIDENCE HIGH, verdict PASS or STOP, and no **คำถาม** block: go straight to step 6 for that card.
- Everything else (MEDIUM or LOW, NEEDS-INFO, ASK-HUMAN, or any comment with a question): show VERDICT, CONFIDENCE, CHECKS with evidence, the comment exactly as it would be posted, SUBTASKS and ESTIMATE, and post nothing for that card until the user says so; then do step 6.
- NEEDS-INVESTIGATION is never posted (step 3 handles it).

## 6. Write to the card
1. Post the comment, or replace our earlier comment on that card in place: one containing two U+2063 characters (adjacent or not), or ending with an old footer, "[🤖 Biz ยังไม่ต้อบตอบ อันนี้บอทจ้า]" or "[🌚Biz ยังไม่ต้อบตอบ อันนี้บอทจ้า]". Several candidates: replace the newest and show the others to the user. Never post a second copy, and never overwrite any other bot or person's comment.
2. PASS, NEEDS-INFO and ASK-HUMAN: set Planning (custom field `1769d214-d88b-413e-b56c-45fb86f454cb`) to the newest "Sprint <n>AI (…)" / "Sprint <n> AI (…)" option, read live from `{{mc:mctl}} plugin call clickup-board board.load --params '{"boardId":"<board id>"}' --json` with the board id from step 1. STOP: leave Planning unchanged.
3. PASS with subtasks in SUBTASKS: read the card's existing subtasks first; update one with the same title, create only the missing ones, and set each one's Time estimate. Any other verdict: create none.
4. PASS without subtasks and a numeric ESTIMATE: set the Time estimate (the ClickUp update-task tool takes minutes: hours × 60). PASS with subtasks: clear the parent's estimate. ESTIMATE "none" or any other verdict: leave it untouched.
5. Read the card back and report what saved: the comment present once and containing the two U+2063 characters, the Planning value, subtasks, the Time estimate in hours.

## 7. Report
A table: card (linked by name), verdict, confidence, posted on its own or waiting for the user, estimate, sprint, and anything that did not save or stopped at the run limit.
