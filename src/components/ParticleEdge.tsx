import { useEffect, useRef, useState } from 'react'
import {
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
import { theme } from '../theme'
import { useProgress } from '../animation/useClock'
import type { FlowEdgeData } from '../diagrams/types'

const PARTICLES = 3

export function ParticleEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
  } = props
  const data = (props.data ?? {}) as FlowEdgeData
  const optional = data.variant === 'optional'
  const speed = data.speed ?? 1

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const progress = useProgress()
  const pathRef = useRef<SVGPathElement>(null)
  const [len, setLen] = useState(0)

  // Recompute the path length whenever the geometry changes (layout / diagram switch).
  useEffect(() => {
    if (pathRef.current) setLen(pathRef.current.getTotalLength())
  }, [edgePath])

  // A `color` marks an emphasized route (e.g. the native OTel endpoint): brighter, thicker,
  // glowing, with larger particles so it stands out against the default muted edges.
  const emphasized = !!data.color
  const particleColor = data.color ?? (optional ? '#caa94e' : theme.yellow)
  const stroke = emphasized ? data.color! : optional ? '#5a5440' : '#4d4a38'
  const strokeWidth = emphasized ? 3 : optional ? 1.5 : 2
  const dash = optional ? (emphasized ? '12 7' : '6 6') : undefined
  const outerR = emphasized ? 13 : optional ? 7 : 9
  const innerR = emphasized ? 4.2 : optional ? 2.4 : 3.2

  const particles: React.ReactNode[] = []
  if (len > 0 && pathRef.current) {
    for (let i = 0; i < PARTICLES; i++) {
      const t = ((progress * speed) % 1) + i / PARTICLES
      const pt = pathRef.current.getPointAtLength((t % 1) * len)
      particles.push(
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r={outerR} fill={particleColor} opacity={0.2} />
          <circle cx={pt.x} cy={pt.y} r={innerR} fill={particleColor} />
        </g>,
      )
    }
  }

  return (
    <>
      {/* Wide transparent path: gives the edge a hover/select target so the reconnect anchors
          (draggable endpoints) appear and can be dragged to another node side. */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />
      {emphasized && (
        // soft underglow so the highlighted route reads clearly
        <path
          d={edgePath}
          fill="none"
          stroke={data.color!}
          strokeWidth={10}
          strokeLinecap="round"
          opacity={0.18}
        />
      )}
      <path
        id={id}
        ref={pathRef}
        d={edgePath}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dash}
        markerEnd={markerEnd}
      />
      {particles}
      {data.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              fontSize: emphasized ? 13 : 12,
              fontWeight: emphasized ? 700 : 600,
              color: emphasized ? data.color! : theme.text,
              background: theme.inkSoft,
              border: `1px solid ${emphasized ? data.color! : theme.panelBorder}`,
              padding: '2px 8px',
              borderRadius: 999,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
