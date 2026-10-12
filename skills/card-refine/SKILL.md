---
name: card-refine
description: Use when asked to refine, gate or check readiness of one or more ClickUp cards ("refine this card", "run biz-gate on …", a pasted card link). Gathers the evidence, runs the biz-gate agent per card, posts HIGH-confidence comments on its own and shows MEDIUM/LOW drafts for approval, moves the card to the latest AI sprint, sets the Fibonacci estimate and reads the card back.
---

# card-refine

Runs the biz-gate agent on ClickUp cards the way it was tuned: evidence first, only proven (HIGH) comments posted on their own, everything else shown to the user first, and every write read back.

## 1. Check prerequisites (stop and name what is missing)
- The clickup-board plugin answers: `{{mc:mctl}} plugin call clickup-board boards.list --json`.
- A board is saved in clickup-board: `{{mc:mctl}} plugin call clickup-board boards.list --json` (the saved board whose folder is `~/klangtech`, or the only one).
- The `inv-prod` skill (read-only production investigation) is installed, and you can reach production with it.

## 2. Gather the evidence, one folder per card
For each card, in `<scratch>/cards/<card-id>/` (never shared between cards, never inside a repo):
- `card.md`: `{{mc:mctl}} plugin call clickup-board source.item --params '{"id":"<card-id>"}' --json` → `contextMarkdown`.
- Every screenshot: number them in the order their image links appear in the card's description, which the card text above does not keep (it lists them under Attachments in a different order). Read the description with the ClickUp get-task tool (`markdown_description`, one call per card), then `curl -sS -o <n>.png '<url>'` in that order, plus any attachment not in the description after them. Open each one yourself and note what it shows.
- Bug card (Log Type 🐛Bug/🦋SuperBug, or BUG/🐛 in the title): run `inv-prod` yourself (read-only), light queries only, and write what you found to `prod.md`: what was searched, where, and the results, including what could not be read. Never let a background agent be the only one to try production: its access can be blocked.

## 3. Run biz-gate
One agent per card, cards in parallel. Give each its card folder and tell it to use those files, not to download or query production itself.

## 4. Check the result before posting or showing it
- Layout, every card: bold first line; the business block (bug card with PASS or NEEDS-INFO: bold ต้นเหตุ / แผนแก้ / แผนป้องกัน; any other card: bold สรุป with one or two lines); then, only if there are questions, bold คำถาม and at most 2 question bullets; an empty line, `---`, an empty line; dev bullets with facts only; no footer line; the first line, business lines, questions and the last dev bullet end with ครับ, and the last dev bullet then ends with two U+2063 characters. At most 12 lines and 5 bullets; another card linked once by its name.
- CONFIDENCE matches CHECKS: no PASS or hours unless A, B and C are all yes with evidence.
- Every estimated part of the fix is tied to the evidence in A; nothing "nice to clean up" carries hours.
- If a check looks wrong (e.g. the agent read the wrong screenshots), fix the evidence and run it again; never pass it on.

## 5. Post HIGH, show the rest
- CONFIDENCE HIGH: go straight to step 6 for that card.
- MEDIUM or LOW: show VERDICT, CONFIDENCE, CHECKS with evidence, the comment exactly as it would be posted, SUBTASKS and ESTIMATE, and post nothing for that card until the user says so; then do step 6.

## 6. Write to the card
1. Post the comment, or replace our earlier comment on that card in place (it contains two U+2063 characters back to back, or ends with the old footer "[🤖 Biz ยังไม่ต้อบตอบ อันนี้บอทจ้า]"); never post a second copy.
2. Set Planning (custom field `1769d214-d88b-413e-b56c-45fb86f454cb`) to the newest "Sprint <n>AI (…)" / "Sprint <n> AI (…)" option, read live from `{{mc:mctl}} plugin call clickup-board board.load --params '{"boardId":"<board id>"}' --json` with the board id from step 1.
   Do this for every verdict.
3. PASS with real subtasks in SUBTASKS (not "possible:"): create each under the card with its title and set its Time estimate. Any other verdict: create none.
4. PASS without subtasks: set the Time estimate from ESTIMATE. Otherwise leave it untouched.
5. Read the card back and report what saved: the comment present once and containing the two U+2063 characters, the Planning value, subtasks, the Time estimate.

## 7. Report
A table: card (linked by name), verdict, confidence, posted on its own or waiting for the user, estimate, sprint, and anything that did not save.
