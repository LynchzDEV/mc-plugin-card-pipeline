#!/usr/bin/env bash
# usage: round-run.sh <round> [card ...] — runs the project-manager headlessly on each card in parallel, archives, scores (JUDGE_RUNS=3)
set -u
R=$1; shift
W=${CARD_PIPELINE_ROOT:?set CARD_PIPELINE_ROOT to the plugin checkout}; C=${CARD_PIPELINE_LOOP:-$HOME/.cache/card-pipeline-loop}
CARDS=${*:-14znf2fuv78 14znf2futr8 14znf2futry 14znf2futhy}
mkdir -p $C/rounds/$R && cp $W/agents/project-manager.md $C/rounds/$R/project-manager.frozen.md
for id in $CARDS; do
  S=$HOME/.cache/card-pipeline/cards/$id
  rm -f $S/{package.md,facts.md,comment.md,subtasks.json,lint.txt,prod-questions.md} $S/judge-prompt-*.md $S/judge-answer-*.json
  PROMPT="Read and follow exactly the agent definition at $W/agents/project-manager.md. You are that agent for ONE card. Inputs:
--card $S
--examples $C/examples-minus/$id
--registry $W/skills/card-refine/scripts/repo-registry.json
--architect $W/agents/code-architect.md
Repos root: $HOME/klangtech (read-only; the working tree as checked out — never git fetch, never read origin/* refs or commits newer than the checkout). The lint command is \`bun $W/skills/card-refine/scripts/lint.ts ...\` as the definition describes (same folder as --registry). The code-architect subagent type is not installed: call it with the Agent tool as subagent_type general-purpose, model opus, and begin its prompt with \"Read and follow exactly the agent definition at $W/agents/code-architect.md\", then give it the ask list, the repos root and the registry path. Write facts.md, prod-questions.md, comment.md, subtasks.json, lint.txt and package.md into the card folder. Never write anywhere else, never touch ClickUp or production. Your final message is package.md verbatim."
  ( cd $C && claude -p --model opus --output-format json "$PROMPT" > $C/rounds/$R/$id.run.json 2> $C/rounds/$R/$id.run.err; echo "$id pm exit=$?"; $C/round-archive.sh $R $id > /dev/null ) &
done
wait
JUDGE_RUNS=${JUDGE_RUNS:-3} $C/round-score.sh $R $CARDS | tee $C/rounds/$R/RESULT.md
