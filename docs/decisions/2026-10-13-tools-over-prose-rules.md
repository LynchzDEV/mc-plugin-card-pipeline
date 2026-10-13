# 2026-10-13 — Tools over prose rules for the project-manager

## What happened
Rounds 1–10 of the answer-key loop fixed the project-manager by adding prose rules. Each rule fixed one reference card and broke another: the parity rule flipped 14znf2fuv78 between "view-only screen" (cancel/resend dropped) and "imports the old screen's Recover button"; the source rule flipped 14znf2futry between "Vayu date read on the Army side" and "api sends it". Round 9 scored 0 / 100 / 0 / 97.

## Decision
A failure class that recurs twice across rounds gets a deterministic tool or a lint error the agent must call or pass, never another rule:
- `where.ts` — which repo owns a table or column for a system word (migration filename → owner; engine copies in host and dummy apps are "also loaded in").
- `anchor.ts` — nearest anchor rows and the Fibonacci bucket for a subtask title (Thai keywords on anchor labels; repo → system mapping for the sprint 16–17 actuals).
- lint `scope-moved-to-sibling` (error) — a line that links another card and hands it work.
- judge: a design decision the draft states as its own (empty state, label, parity, smaller reading) is a supported claim and never a fabricated value.

The prompt keeps the workflow, the output format and the examples; rules that cannot be mechanised stay as examples.

## Evidence
Round 10 (last prose prompt, fixed judge): 99 / 100 / 96 / 94. G2 sample of five migrate-1 cards, keyless judge: old prompt 0 / 99 / 88 / 100 / 90 (fixed judge) → tool prompt 96 / 98 / 95 / 96 / 97.

## Owner's words
"You just randomly put a bunch of text over and over to fix one then two broke … you could have just made some tools that reliable so AI can call" (2026-10-13 14:20).
