import type { DiagramDef } from './types'

// A layered platform overview (rendered by StackDiagram, not React Flow). Apps / Users / APIs on
// top; the ClickHouse-centered platform (UIs · DBs · Stream) with an LLMs column beside it; open
// table formats, data lake, and other sources underneath.
export const dataStack: DiagramDef = {
  id: 'data-stack',
  title: 'Data Stack',
  kind: 'stack',
  description:
    'The DiagramHouse data stack at a glance: ClickHouse at the center, fed by ClickPipes from open table formats / data lakes / other sources and from Postgres, surfaced through LibreChat, HyperDX, and Langfuse, and connected to LLMs — serving apps, users, and APIs.',
  nodes: [],
  edges: [],
}
