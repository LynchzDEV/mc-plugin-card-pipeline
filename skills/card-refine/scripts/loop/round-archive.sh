#!/usr/bin/env bash
# usage: round-archive.sh <round> <card> — moves a finished card folder's outputs into the round dir and frees the folder
set -u
R=$1; id=$2; C=${CARD_PIPELINE_LOOP:-$HOME/.cache/card-pipeline-loop}; S=$HOME/.cache/card-pipeline/cards/$id; D=$C/rounds/$R/$id
mkdir -p $D && cp $S/{package.md,comment.md,subtasks.json,facts.md,lint.txt,card.md,fields.json} $D/ 2>/dev/null; cp $S/related.md $S/owner.md $D/ 2>/dev/null
rm -f $S/{package.md,facts.md,comment.md,subtasks.json,lint.txt,prod-questions.md} $S/judge-prompt-*.md
ls $D | tr '\n' ' '; echo
