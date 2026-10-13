export interface PlanningOption {
  id: string
  label: string
}

export interface AiSprintOption extends PlanningOption {
  number: number
}

export type LatestAiSprint =
  | { kind: 'found'; option: AiSprintOption }
  | { kind: 'missing'; reason: string }
  | { kind: 'ambiguous'; reason: string }

export const PLANNING_FIELD_ID = '1769d214-d88b-413e-b56c-45fb86f454cb'

const AI_SPRINT_LABEL = /^Sprint\s+(\d+)\s*AI\b/i

export function parseAiSprintOption(option: PlanningOption): AiSprintOption | null {
  const match = AI_SPRINT_LABEL.exec(option.label)
  return match ? { ...option, number: Number(match[1]) } : null
}

export function latestAiSprint(options: PlanningOption[]): LatestAiSprint {
  const aiOptions = options.map(parseAiSprintOption).filter((option): option is AiSprintOption => option !== null)
  if (!aiOptions.length) {
    return { kind: 'missing', reason: 'no Planning option labelled "Sprint <n>AI" exists' }
  }
  const highest = Math.max(...aiOptions.map((option) => option.number))
  const top = aiOptions.filter((option) => option.number === highest)
  if (top.length > 1) {
    return { kind: 'ambiguous', reason: `several options parse as AI sprint ${highest}: ${top.map((option) => `'${option.label}' (${option.id})`).join(', ')}` }
  }
  return { kind: 'found', option: top[0]! }
}

export function latestAiSprintOption(options: PlanningOption[]): PlanningOption | null {
  const latest = latestAiSprint(options)
  return latest.kind === 'found' ? { id: latest.option.id, label: latest.option.label } : null
}
