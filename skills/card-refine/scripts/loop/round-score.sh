#!/usr/bin/env bash
# usage: round-score.sh <round> [card ...]   — scores every archived package of a round against its key; prints table + misses
set -u
R=$1; shift
W=${CARD_PIPELINE_ROOT:?set CARD_PIPELINE_ROOT to the plugin checkout}; C=${CARD_PIPELINE_LOOP:-$HOME/.cache/card-pipeline-loop}
J="codex exec --skip-git-repo-check -s read-only -m gpt-6-astra"
CARDS=${*:-14znf2fuv78 14znf2futr8 14znf2futry 14znf2futhy}
for id in $CARDS; do
  D=$C/rounds/$R/$id; [ -f $D/package.md ] || { echo "$id: no package in round $R"; continue; }
  [ -f $D/score.json ] && continue
  ( cd $W && JUDGE_RUNS=${JUDGE_RUNS:-2} bun skills/card-refine/scripts/score.ts --package $D/package.md --card $D --key $C/keys/$id.md --judge "$J" --out $D/score.json > $D/score.log 2>&1 ) &
done; wait
python3 - "$R" "$C" $CARDS <<'PY'
import json,sys,glob
R,C=sys.argv[1],sys.argv[2]; rows=[]
print(f"\n## Round {R}\n\n| card | score | verdict | facts | coverage | subtasks | precision | estimate | hard fails |\n|---|---|---|---|---|---|---|---|---|")
for id in sys.argv[3:]:
    f=f"{C}/rounds/{R}/{id}/score.json"
    try: d=json.load(open(f))
    except Exception: print(f"| {id} | — | | | | | | | not scored |"); continue
    m=d['dimensions']; print(f"| {id} | {d['score']} | {m['verdict']} | {m['facts']} | {m['coverage']} | {m['subtasks']} | {m['precision']} | {m['estimate']} | {', '.join(h['code'] for h in d['hardFails']) or '—'} |")
print()
for id in sys.argv[3:]:
    seen=set()
    for a in sorted(glob.glob(f"{C}/rounds/{R}/{id}/judge-answer-*.json")):
        for i in json.load(open(a))['items']:
            if i['verdict']!='yes' and (i['id'],i['verdict']) not in seen:
                seen.add((i['id'],i['verdict'])); print(f"- {id} {i['id']} {i['verdict']}: {i.get('evidence','')[:150]}")
PY
