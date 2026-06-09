import { type NodeProps } from '@xyflow/react'
import { theme } from '../theme'
import type { StageNode } from '../diagrams/types'

export const STAGE_WIDTH = 260

// A non-interactive column header rendered across the top of a diagram (e.g. "Data Sources").
export function StageHeader({ data }: NodeProps<StageNode>) {
  return (
    <div
      style={{
        width: STAGE_WIDTH,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 800,
        letterSpacing: 0.3,
        lineHeight: 1.25,
        color: theme.text,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {data.title}
    </div>
  )
}
