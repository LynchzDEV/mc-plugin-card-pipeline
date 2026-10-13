#!/usr/bin/env bash
# prints the rounds × cards score matrix from score.json files
C=${CARD_PIPELINE_LOOP:-$HOME/.cache/card-pipeline-loop}
python3 - "$C" <<'PY'
import json,sys,os,glob
C=sys.argv[1]; cards=["14znf2fuv78","14znf2futr8","14znf2futry","14znf2futhy"]
rounds=sorted([d for d in os.listdir(f"{C}/rounds") if d.isdigit()],key=int)
print("| round | "+" | ".join(c[-5:] for c in cards)+" | prompt |"); print("|---|"+"---|"*len(cards)+"---|")
for r in rounds:
    row=[]
    for c in cards:
        f=f"{C}/rounds/{r}/{c}/score.json"; alt=f"{C}/rounds/{r}/{c}/score-altkey.json"
        if os.path.exists(f):
            d=json.load(open(f)); v=str(d["score"]) if d["score"] is not None else "—"
            if os.path.exists(alt): v+=f" ({json.load(open(alt))['score']} alt)"
            if d["hardFails"]: v+=" ✗"+",".join(h["code"] for h in d["hardFails"])
        else: v="·"
        row.append(v)
    frozen="frozen" if os.path.exists(f"{C}/rounds/{r}/project-manager.frozen.md") else ""
    print(f"| {r} | "+" | ".join(row)+f" | {frozen} |")
PY
