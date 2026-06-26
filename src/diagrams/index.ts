import type { DiagramDef } from './types'
import { realtime } from './realtime'
import { warehouse } from './warehouse'
import { observability } from './observability'
import { mlgenai } from './mlgenai'
import { ucRealtime, ucWarehouse, ucObservability, ucGenai } from './usecases'
import { vnRealtime, vnWarehouse, vnObservability, vnGenai } from './vendorneutral'
import { gcpRealtime, gcpWarehouse, gcpObservability, gcpMlGenai } from './googlecloud'

export type Collection = {
  id: string
  label: string
  diagrams: DiagramDef[]
}

// The views the sidebar switches between: plain-language use cases, and the AWS / Google Cloud /
// vendor-neutral technical architectures.
export const collections: Collection[] = [
  {
    id: 'usecase',
    label: 'Use Cases',
    diagrams: [ucRealtime, ucWarehouse, ucObservability, ucGenai],
  },
  {
    id: 'architecture',
    label: 'AWS',
    diagrams: [realtime, warehouse, observability, mlgenai],
  },
  {
    id: 'google-cloud',
    label: 'Google Cloud',
    diagrams: [gcpRealtime, gcpWarehouse, gcpObservability, gcpMlGenai],
  },
  {
    id: 'vendor-neutral',
    label: 'Vendor-Neutral',
    diagrams: [vnRealtime, vnWarehouse, vnObservability, vnGenai],
  },
]

// Flat list of every diagram (both views) — used for deep-links and the GIF renderer.
export const diagrams: DiagramDef[] = collections.flatMap((c) => c.diagrams)

export const diagramById: Record<string, DiagramDef> = Object.fromEntries(
  diagrams.map((d) => [d.id, d]),
)

export const defaultDiagramId = collections[0].diagrams[0].id

export function collectionOf(id: string): Collection {
  return collections.find((c) => c.diagrams.some((d) => d.id === id)) ?? collections[0]
}

export type { DiagramDef } from './types'
