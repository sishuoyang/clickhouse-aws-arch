import { useEffect, useRef, useState, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  MarkerType,
  Panel,
  useNodesState,
  useEdgesState,
  reconnectEdge,
  type Node,
  type Edge,
  type Connection,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ServiceNode } from './ServiceNode'
import { ParticleEdge } from './ParticleEdge'
import { StageHeader, STAGE_WIDTH } from './StageHeader'
import { theme } from '../theme'
import { loadLayout, saveLayout, resetLayout, type EdgeOverrideMap } from '../layout'
import type { DiagramDef } from '../diagrams/types'

const nodeTypes = { service: ServiceNode, stage: StageHeader }
const edgeTypes = { particle: ParticleEdge }

const STAGE_HEADER_Y = -10

const btnStyle: React.CSSProperties = {
  cursor: 'pointer',
  border: `1px solid ${theme.panelBorder}`,
  background: theme.panel,
  color: theme.text,
  borderRadius: 10,
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}
const primaryBtnStyle: React.CSSProperties = {
  ...btnStyle,
  background: theme.yellow,
  color: theme.ink,
  border: `1px solid ${theme.yellow}`,
}
const savedBtnStyle: React.CSSProperties = {
  ...btnStyle,
  background: theme.category.consume,
  color: theme.ink,
  border: `1px solid ${theme.category.consume}`,
}

function buildStageNodes(diagram: DiagramDef, hidden: boolean): Node[] {
  return (diagram.stages ?? []).map((s, i) => ({
    id: `stage-${i}`,
    type: 'stage',
    position: { x: s.x - STAGE_WIDTH / 2, y: STAGE_HEADER_Y },
    data: { title: s.title },
    draggable: false,
    selectable: false,
    connectable: false,
    hidden,
  }))
}

// Inner canvas: nodes/edges (with saved overrides) are draggable & reconnectable outside capture
// mode; the stage (group) labels can be toggled on/off. All three — positions, edge handles, and
// the label visibility — persist to the layout file so the GIF renderer reflects them.
function FlowCanvas({
  diagram,
  initialNodes,
  initialEdges,
  initialShowStages,
  capture,
}: {
  diagram: DiagramDef
  initialNodes: Node[]
  initialEdges: Edge[]
  initialShowStages: boolean
  capture: boolean
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [showStages, setShowStages] = useState(initialShowStages)
  const [saved, setSaved] = useState(false)
  const nodesRef = useRef(nodes)
  nodesRef.current = nodes

  // Dragging, reconnecting, and toggling labels update the view live; nothing is written until
  // you click Save layout, which persists the current arrangement as the default loaded on startup.
  const onSave = useCallback(() => {
    const positions: Record<string, { x: number; y: number }> = {}
    for (const n of nodesRef.current) {
      if (n.type === 'service') {
        positions[n.id] = { x: Math.round(n.position.x), y: Math.round(n.position.y) }
      }
    }
    const edgeOverrides: EdgeOverrideMap = {}
    for (const e of edges) {
      edgeOverrides[e.id] = {
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle ?? null,
        targetHandle: e.targetHandle ?? null,
      }
    }
    saveLayout(diagram.id, { nodes: positions, edges: edgeOverrides, showStages })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1600)
  }, [diagram.id, edges, showStages])

  const onReset = useCallback(() => {
    resetLayout(diagram.id).then(() => window.location.reload())
  }, [diagram.id])

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds, { shouldReplaceId: false }))
    },
    [setEdges],
  )

  const toggleStages = useCallback(() => {
    setShowStages((prev) => {
      const next = !prev
      setNodes((nds) => nds.map((n) => (n.type === 'stage' ? { ...n, hidden: !next } : n)))
      return next
    })
  }, [setNodes])

  const hasStages = (diagram.stages?.length ?? 0) > 0

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onReconnect={onReconnect}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={{
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#4d4a38',
          width: 16,
          height: 16,
        },
      }}
      fitView
      fitViewOptions={{ padding: 0.16 }}
      nodesDraggable={!capture}
      nodesConnectable={!capture}
      edgesReconnectable={!capture}
      elementsSelectable={!capture}
      panOnDrag
      zoomOnScroll
      minZoom={0.2}
      maxZoom={1.5}
      proOptions={{ hideAttribution: true }}
    >
      {/* Layout controls. Panel carries the react-flow__panel class, which is hidden in capture
          mode — so these never appear in the GIF. */}
      {!capture && (
        <Panel
          position="top-right"
          style={{ marginTop: 60, display: 'flex', flexDirection: 'row', gap: 8 }}
        >
          <button onClick={onSave} style={saved ? savedBtnStyle : primaryBtnStyle}>
            {saved ? '✓ Saved as default' : '💾 Save layout'}
          </button>
          <button onClick={onReset} style={btnStyle}>
            ⤺ Reset layout
          </button>
          {hasStages && (
            <button onClick={toggleStages} style={btnStyle}>
              {showStages ? '⊟ Hide group labels' : '⊞ Show group labels'}
            </button>
          )}
        </Panel>
      )}
      <Background color="#2c2c2c" gap={28} size={1} />
    </ReactFlow>
  )
}

export function DiagramCanvas({
  diagram,
  capture,
}: {
  diagram: DiagramDef
  capture: boolean
}) {
  // Resolve saved positions, edge handle overrides, and label visibility BEFORE mounting.
  const [initial, setInitial] = useState<{
    nodes: Node[]
    edges: Edge[]
    showStages: boolean
  } | null>(null)

  useEffect(() => {
    let active = true
    setInitial(null)
    loadLayout(diagram.id).then(({ positions, edges, showStages }) => {
      if (!active) return
      const service = diagram.nodes.map((n) =>
        positions[n.id] ? { ...n, position: positions[n.id] } : n,
      )
      const resolvedEdges = diagram.edges.map((e) =>
        edges[e.id] ? { ...e, ...edges[e.id] } : e,
      )
      setInitial({
        nodes: [...buildStageNodes(diagram, !showStages), ...service],
        edges: resolvedEdges,
        showStages,
      })
    })
    return () => {
      active = false
    }
  }, [diagram])

  if (!initial) {
    return <div style={{ position: 'absolute', inset: 0, background: theme.ink }} />
  }

  return (
    <FlowCanvas
      key={diagram.id}
      diagram={diagram}
      initialNodes={initial.nodes}
      initialEdges={initial.edges}
      initialShowStages={initial.showStages}
      capture={capture}
    />
  )
}
