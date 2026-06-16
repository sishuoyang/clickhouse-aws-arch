import { Handle, Position, type NodeProps } from '@xyflow/react'
import { theme } from '../theme'
import { iconSvg } from '../icons'
import type { ServiceNode as ServiceNodeType } from '../diagrams/types'

// Handles are hidden by default and revealed on node hover / during a reconnect (see index.css).
const handleStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  background: theme.yellow,
  border: `2px solid ${theme.ink}`,
  borderRadius: '50%',
}

export function ServiceNode({ data, selected }: NodeProps<ServiceNodeType>) {
  const accent = theme.category[data.category]
  const hero = !!data.hero
  // ClickStack members (the OTel collector, ClickHouse, HyperDX) get the same yellow ring so the
  // trio reads as one family even though they sit in different columns.
  const clickstack = !!data.clickstack
  const svg = iconSvg(data.icon)

  return (
    <div
      style={{
        position: 'relative',
        width: hero ? 240 : 204,
        padding: hero ? '18px 18px' : '15px 16px',
        borderRadius: 16,
        background: hero
          ? 'linear-gradient(160deg, #2a2a18 0%, #1d1d12 100%)'
          : theme.panel,
        border: `2px solid ${hero || clickstack ? theme.yellow : accent}`,
        boxShadow: hero
          ? `0 0 0 1px ${theme.yellow}33, 0 0 28px ${theme.yellow}55`
          : clickstack
            ? `0 0 0 1px ${theme.yellow}33, 0 0 18px ${theme.yellow}44`
            : selected
              ? `0 0 0 1px ${accent}`
              : '0 6px 18px rgba(0,0,0,0.45)',
        color: theme.text,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <Handle id="l" type="target" position={Position.Left} style={handleStyle} />
      <Handle id="tr" type="target" position={Position.Right} style={handleStyle} />
      <Handle id="t" type="target" position={Position.Top} style={handleStyle} />
      <Handle id="b" type="target" position={Position.Bottom} style={handleStyle} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: hero ? 48 : 40,
            height: hero ? 48 : 40,
            flexShrink: 0,
            borderRadius: 10,
            background: hero ? '#00000055' : '#ffffff0d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 6,
          }}
        >
          {svg ? (
            <span
              style={{ width: '100%', height: '100%', display: 'block' }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <span style={{ fontSize: 18 }}>◆</span>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: hero ? 19 : 16,
              fontWeight: 700,
              lineHeight: 1.2,
              color: hero ? theme.yellow : theme.text,
            }}
          >
            {data.label}
          </div>
          {data.sub && (
            <div
              style={{
                fontSize: 13,
                color: theme.textMuted,
                marginTop: 3,
                lineHeight: 1.2,
              }}
            >
              {data.sub}
            </div>
          )}
        </div>
      </div>

      {data.badge && (
        <div
          style={{
            alignSelf: 'flex-start',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.2,
            color: theme.ink,
            background: theme.yellow,
            borderRadius: 999,
            padding: '3px 10px',
          }}
        >
          {data.badge}
        </div>
      )}

      {data.stats && data.stats.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {data.stats.map((s, i) => (
            <span
              key={i}
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: theme.yellow,
                background: `${theme.yellow}14`,
                border: `1px solid ${theme.yellow}66`,
                borderRadius: 999,
                padding: '2px 8px',
                whiteSpace: 'nowrap',
              }}
            >
              {s}
            </span>
          ))}
        </div>
      )}

      <Handle id="r" type="source" position={Position.Right} style={handleStyle} />
      <Handle id="sl" type="source" position={Position.Left} style={handleStyle} />
      <Handle id="st" type="source" position={Position.Top} style={handleStyle} />
      <Handle id="sb" type="source" position={Position.Bottom} style={handleStyle} />
    </div>
  )
}
