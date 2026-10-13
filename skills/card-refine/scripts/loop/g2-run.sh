#!/usr/bin/env bash
# usage: g2-run.sh <round> [card ...] — headless project-manager on the G2 (keyless) cards, full plugin examples, no-key scoring
set -u
R=$1; shift
W=${CARD_PIPELINE_ROOT:?set CARD_PIPELINE_ROOT to the plugin checkout}; C=${CARD_PIPELINE_LOOP:-$HOME/.cache/card-pipeline-loop}; G=$C/g2/$R
J="codex exec --skip-git-repo-check -s read-only -m gpt-6-astra"
CARDS=${*:-14znf2fuqr9 14znf2futu3 14znf2fuvcn 14znf2fuvc8 14znf2futt4}
mkdir -p $G && cp $W/agents/project-manager.md $G/project-manager.frozen.md
for id in $CARDS; do
  S=$HOME/.cache/card-pipeline/cards/$id
  rm -f $S/{package.md,facts.md,comment.md,subtasks.json,lint.txt,prod-questions.md} $S/judge-prompt-*.md $S/judge-answer-*.json
  PROMPT="Read and follow exactly the agent definition at $W/agents/project-manager.md. You are that agent for ONE card. Inputs:
--card $S
--examples $W/skills/card-refine/examples
--registry $W/skills/card-refine/scripts/repo-registry.json
--architect $W/agents/code-architect.md
Repos root: $HOME/klangtech (read-only; the working tree as checked out — never git fetch, never read origin/* refs or commits newer than the checkout). The lint command is \`bun $W/skills/card-refine/scripts/lint.ts ...\` as the definition describes (same folder as --registry). The code-architect subagent type is not installed: call it with the Agent tool as subagent_type general-purpose, model opus, and begin its prompt with \"Read and follow exactly the agent definition at $W/agents/code-architect.md\", then give it the ask list, the repos root and the registry path. Write facts.md, prod-questions.md, comment.md, subtasks.json, lint.txt and package.md into the card folder. Never write anywhere else, never touch ClickUp or production. Your final message is package.md verbatim."
  ( cd $C && claude -p --model opus --output-format json "$PROMPT" > $G/$id.run.json 2> $G/$id.run.err; echo "$id pm exit=$?"
    D=$G/$id; mkdir -p $D && cp $S/{package.md,comment.md,subtasks.json,facts.md,prod-questions.md,lint.txt,card.md,fields.json,related.md} $D/ 2>/dev/null
    rm -f $S/{package.md,facts.md,comment.md,subtasks.json,lint.txt,prod-questions.md} $S/judge-prompt-*.md
    [ -f $D/package.md ] && ( cd $W && JUDGE_RUNS=${JUDGE_RUNS:-3} bun skills/card-refine/scripts/score.ts --package $D/package.md --card $D --no-key --judge "$J" --anchors $W/skills/card-refine/examples/anchors.md --out $D/score.json > $D/score.log 2>&1 ) ) &
done
wait
python3 - "$G" $CARDS <<'PY'
import json,sys,glob
G=sys.argv[1]
print(f"\n## G2 {G.split('/')[-1]}\n\n| card | score | verdict | facts | subtasks | estimate | hard fails |\n|---|---|---|---|---|---|---|")
for id in sys.argv[2:]:
    try: d=json.load(open(f"{G}/{id}/score.json"))
    except Exception: print(f"| {id} | — | | | | | not scored |"); continue
    m=d['dimensions']; print(f"| {id} | {d['score']} | {m.get('verdict')} | {m.get('facts')} | {m.get('subtasks')} | {m.get('estimate')} | {', '.join(h['code'] for h in d['hardFails']) or '—'} |")
print()
for id in sys.argv[2:]:
    seen=set()
    for a in sorted(glob.glob(f"{G}/{id}/judge-answer-*.json")):
        for c in json.load(open(a)).get('claims',[]):
            if c.get('verdict')!='yes' and c.get('id') not in seen: seen.add(c.get('id')); print(f"- {id} {c.get('id')} {c.get('verdict')}: {str(c.get('text',''))[:120]} | {str(c.get('evidence',''))[:150]}")
PY
