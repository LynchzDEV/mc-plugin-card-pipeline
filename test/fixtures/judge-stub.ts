const promptText = process.argv[2] ?? ''
const mode = process.env.JUDGE_STUB_MODE ?? 'all-yes'

if (mode === 'no-json') {
  process.stdout.write('I could not decide.\n')
  process.exit(0)
}

const ids = [...promptText.matchAll(/^- ([KIS]\d+):/gm)].map(([, id]) => id!)
const items = ids.map((id) => ({ id, verdict: mode === 'k-no' && id.startsWith('K') ? 'no' : 'yes', evidence: 'stub' }))
const answer: Record<string, unknown> = { items: mode === 'items-missing' ? [] : items, claims: [{ id: 'D1', text: 'stub claim', verdict: 'yes', evidence: 'stub' }], hardFails: [], anchor: { row: 1 } }
if (mode === 'claims-missing') delete answer.claims
if (mode === 'duplicate-claim') answer.claims = [{ id: 'D1', text: 'stub claim', verdict: 'yes', evidence: 'stub' }, { id: 'D1', text: 'other claim', verdict: 'no', evidence: 'stub' }]
if (mode === 'claim-without-text') answer.claims = [{ id: 'D1', verdict: 'yes' }]
if (mode === 'bad-verdict') answer.items = items.map((item) => ({ ...item, verdict: 'maybe' }))
if (mode === 'duplicate-item') answer.items = [...items, { ...items[0], verdict: 'no' }]
process.stdout.write(`Thinking done.\n${JSON.stringify(answer)}\n`)
