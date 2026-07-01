import type { Edge, Node } from '@xyflow/react'
import type { Category } from '../theme'

export type ServiceNodeData = {
  /** Display name, e.g. "Amazon MSK" */
  label: string
  /** Optional second line, e.g. "Managed Kafka" */
  sub?: string
  /** Pipeline stage — drives node color and visual emphasis */
  category: Category
  /** Icon registry key (e.g. "msk", "clickhouse") — see src/icons/index.ts */
  icon?: string
  /** Extra badge text rendered on the node (e.g. "Materialized Views") */
  badge?: string
  /** Highlighted performance/scale stats rendered as pills (e.g. "Sub-second", "Petabyte scale") */
  stats?: string[]
  /** Visually emphasize this node (used for the ClickHouse hub) */
  hero?: boolean
  /** Mark as part of ClickStack — adds a yellow highlight ring so the OTel/ClickHouse/HyperDX trio reads as one family */
  clickstack?: boolean
  /** Customer logos for the dashed "in production at" panel on use-case diagrams. Each links to a story. */
  logos?: { icon: string; name: string; url?: string }[]
  /** Allow Record<string, unknown> compatibility for React Flow */
  [key: string]: unknown
}

export type FlowEdgeData = {
  /** 'optional' renders a dashed, dimmer edge (e.g. the Managed Flink branch) */
  variant?: 'primary' | 'optional'
  /** Relative particle speed multiplier (default 1) */
  speed?: number
  /** Small label rendered at the edge midpoint (e.g. "ClickPipes", "CDC") */
  label?: string
  /** Override particle/edge accent color (e.g. blue for a "Native OTel" route) */
  color?: string
  [key: string]: unknown
}

/**
 * Connection points exposed by a service node — every side has both a source and a target handle
 * so an edge end can be dragged (reconnected) to any side.
 * Targets: l (left), tr (right), t (top), b (bottom). Sources: r (right), sl (left), st (top), sb (bottom).
 */
export type HandleId = 'l' | 'r' | 't' | 'b' | 'st' | 'sb' | 'tr' | 'sl'

export type StageHeaderData = {
  title: string
  [key: string]: unknown
}

// `type` is a string so a diagram can use specialized renderers (e.g. the animated 'dashboard'
// and 'team' nodes in the real-time use case) alongside the default 'service' card.
export type ServiceNode = Node<ServiceNodeData>
export type StageNode = Node<StageHeaderData, 'stage'>
export type FlowEdge = Edge<FlowEdgeData>

/** A column header (e.g. "Data Sources"). `x` is the column CENTER x. */
export type StageDef = { title: string; x: number }

export type DiagramDef = {
  id: string
  /** Sidebar label */
  title: string
  /** One-line description shown under the title */
  description: string
  /** Render mode: 'flow' (default, React Flow node graph) or 'stack' (layered platform overview) */
  kind?: 'flow' | 'stack'
  /** Column headers rendered across the top (SA-style swimlane stages) */
  stages?: StageDef[]
  nodes: ServiceNode[]
  edges: FlowEdge[]
}

export const NODE_W = 204
export const HERO_W = 240

/** Helper to build a service node positioned by its TOP-LEFT corner. */
export function node(
  id: string,
  x: number,
  y: number,
  data: ServiceNodeData,
): ServiceNode {
  return { id, type: 'service', position: { x, y }, data }
}

/**
 * Build a service node positioned by its COLUMN-CENTER x and top y.
 * Keeps columns visually aligned regardless of hero vs standard node width.
 */
export function cnode(
  id: string,
  centerX: number,
  y: number,
  data: ServiceNodeData,
  opts: { type?: string; w?: number } = {},
): ServiceNode {
  const w = opts.w ?? (data.hero ? HERO_W : NODE_W)
  return { id, type: opts.type ?? 'service', position: { x: centerX - w / 2, y }, data }
}

/**
 * Helper to build a particle edge. Defaults to leaving the source's right handle ('r')
 * and entering the target's left handle ('l'); override via opts for top/bottom routing.
 */
export function edge(
  source: string,
  target: string,
  data: FlowEdgeData = {},
  opts: { sourceHandle?: HandleId; targetHandle?: HandleId } = {},
): FlowEdge {
  return {
    id: `${source}->${target}`,
    source,
    target,
    type: 'particle',
    sourceHandle: opts.sourceHandle ?? 'r',
    targetHandle: opts.targetHandle ?? 'l',
    data: { variant: 'primary', ...data },
  }
}
