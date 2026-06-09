// Client helpers for persisting per-diagram layout to the dev/preview server
// (see the layoutPersistence plugin in vite.config.ts). This lets you drag nodes AND reconnect
// edge ends to different sides, and have both the browser and the headless GIF renderer pick up
// the same layout.

export type PositionMap = Record<string, { x: number; y: number }>

export type EdgeOverride = {
  source?: string
  target?: string
  sourceHandle?: string | null
  targetHandle?: string | null
}
export type EdgeOverrideMap = Record<string, EdgeOverride>

export type Layout = {
  positions: PositionMap
  edges: EdgeOverrideMap
  /** Whether the stage (group) header labels are shown. Defaults to true. */
  showStages: boolean
}

const EMPTY: Layout = { positions: {}, edges: {}, showStages: true }

export async function loadLayout(id: string): Promise<Layout> {
  try {
    const res = await fetch(`/__layout/${id}`)
    if (!res.ok) return EMPTY
    const obj = await res.json()
    if (obj && typeof obj === 'object' && ('nodes' in obj || 'edges' in obj || 'showStages' in obj)) {
      return {
        positions: obj.nodes ?? {},
        edges: obj.edges ?? {},
        showStages: obj.showStages ?? true,
      }
    }
    // Backward compatibility: older files were a flat { nodeId: {x,y} } position map.
    return { positions: (obj as PositionMap) ?? {}, edges: {}, showStages: true }
  } catch {
    return EMPTY
  }
}

export async function saveLayout(
  id: string,
  layout: { nodes: PositionMap; edges: EdgeOverrideMap; showStages: boolean },
): Promise<void> {
  try {
    await fetch(`/__layout/${id}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(layout),
    })
  } catch {
    /* persistence is best-effort (e.g. on a static host without the middleware) */
  }
}

export async function resetLayout(id: string): Promise<void> {
  try {
    await fetch(`/__layout/${id}`, { method: 'DELETE' })
  } catch {
    /* ignore */
  }
}
