import type { DiagramDef } from './types'
import { realtime } from './realtime'
import { warehouse } from './warehouse'
import { observability } from './observability'
import { mlgenai } from './mlgenai'

export const diagrams: DiagramDef[] = [
  realtime,
  warehouse,
  observability,
  mlgenai,
]

export const diagramById: Record<string, DiagramDef> = Object.fromEntries(
  diagrams.map((d) => [d.id, d]),
)

export const defaultDiagramId = diagrams[0].id

export type { DiagramDef } from './types'
