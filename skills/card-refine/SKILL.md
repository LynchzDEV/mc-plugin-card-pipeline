---
name: card-refine
description: Use when asked to refine, gate or check readiness of one or more ClickUp cards ("refine this card", "run biz-gate on …", a pasted card link). Gathers the evidence, runs the biz-gate agent per card, shows every draft for approval, then posts it, moves the card to the latest AI sprint, sets the Fibonacci estimate and reads the card back.
---

# card-refine

Runs the biz-gate agent on ClickUp cards the way it was tuned: evidence first, drafts shown before anything is posted, and every write read back.

## 1. Check prerequisites (stop and name what is missing)
- The clickup-board plugin answers: `{{mc:mctl}} plugin call clickup-board boards.list --json`.
- The team knowledge file exists: `{{setting:teamKnowledgeFile}}`.
- The production investigation skill named in the team file is installed.

## 2. Gather the evidence, one folder per card
For each card, in `<scratch>/cards/<card-id>/` (never shared between cards, never inside a repo):
- `card.md`: `{{mc:mctl}} plugin call clickup-board source.item --params '{"id":"<card-id>"}' --json` → `contextMarkdown`.
- Every screenshot in the card's description and attachments: `curl -sS -o <n>.png '<url>'`. Open each one yourself and note what it shows.
- Bug card (Log Type 🐛Bug/🦋SuperBug, or BUG/🐛 in the title): run the team's read-only production investigation yourself, light queries only, and write what you found to `prod.md`: what was searched, where, and the results, including what could not be read. Never let a background agent be the only one to try production: its access can be blocked.

## 3. Run biz-gate
One agent per card, cards in parallel. Give each its card folder and tell it to use those files, not to download or query production itself.

## 4. Check the result before showing it
- The comment follows the layout, line limits and card-link rule in the agent.
- CONFIDENCE matches CHECKS: no PASS or hours unless A, B and C are all yes with evidence.
- Every estimated part of the fix is tied to the evidence in A; nothing "nice to clean up" carries hours.
- If a check looks wrong (e.g. the agent read the wrong screenshots), fix the evidence and run it again; never pass it on.

## 5. Show every draft and wait
Show, per card: VERDICT, CONFIDENCE, CHECKS with evidence, the comment exactly as it would be posted, SUBTASKS, ESTIMATE. Post nothing until the user says so.

## 6. On the user's OK, per card
1. Post the comment, or replace your earlier comment on that card in place (never a second copy).
2. Set Planning (`{{setting:planningFieldId}}`) to the newest option matching `{{setting:aiSprintPattern}}`, read live from `{{mc:mctl}} plugin call clickup-board board.load --params '{"boardId":"{{setting:clickupBoardId}}"}' --json`.
3. Set the Time estimate from ESTIMATE (on subtasks when the card has them).
4. Read the card back and report what saved: comment present, footer `{{setting:commentFooter}}`, Planning value, Time estimate.

## 7. Report
A table: card (linked by name), verdict, confidence, estimate, sprint, and anything that did not save.
