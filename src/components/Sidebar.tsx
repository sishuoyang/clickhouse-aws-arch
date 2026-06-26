import { useState } from 'react'
import { theme } from '../theme'
import { icons } from '../icons'
import type { Collection, DiagramDef } from '../diagrams'

const RAIL = 52
const WIDTH = 248

const pinBtnStyle: React.CSSProperties = {
  cursor: 'pointer',
  width: 26,
  height: 26,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 8,
  background: theme.panel,
  color: theme.text,
  border: `1px solid ${theme.panelBorder}`,
  fontSize: 15,
  lineHeight: 1,
}

const railWrap: React.CSSProperties = {
  width: RAIL,
  flexShrink: 0,
  height: '100%',
  background: theme.inkSoft,
  borderRight: `1px solid ${theme.panelBorder}`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '16px 0',
  gap: 14,
}

export function Sidebar({
  collections,
  activeCollectionId,
  onSelectCollection,
  diagrams,
  activeId,
  onSelect,
  autoPlay,
  onToggleAutoPlay,
  collapsed,
  onToggleCollapse,
}: {
  collections: Collection[]
  activeCollectionId: string
  onSelectCollection: (id: string) => void
  diagrams: DiagramDef[]
  activeId: string
  onSelect: (id: string) => void
  autoPlay: boolean
  onToggleAutoPlay: () => void
  // `collapsed` is the user's pin preference: false = pinned open (docked), true = auto-collapse rail.
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const [hover, setHover] = useState(false)
  const active = diagrams.find((d) => d.id === activeId)

  // The full menu, shared by the pinned (docked) layout and the hover-expanded overlay.
  const fullMenu = (
    <div
      style={{
        width: WIDTH,
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        padding: 16,
        gap: 13,
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          aria-label="ClickHouse"
          style={{ width: 26, height: 26, display: 'block', flexShrink: 0 }}
          dangerouslySetInnerHTML={{ __html: icons.clickhouse }}
        />
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>
          DiagramHouse
          <div style={{ fontSize: 10.5, color: theme.textMuted, fontWeight: 500 }}>
            ClickHouse Reference Architectures
          </div>
        </div>
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Keep menu open' : 'Auto-hide menu'}
          aria-label={collapsed ? 'Pin menu open' : 'Auto-hide menu'}
          style={{ ...pinBtnStyle, marginLeft: 'auto', alignSelf: 'flex-start' }}
        >
          {collapsed ? '«' : '»'}
        </button>
      </div>

      {/* View switcher */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: 10, color: theme.textMuted, fontWeight: 600, letterSpacing: 0.4 }}>
          VIEW
        </span>
        {collections.map((c) => {
          const isActive = c.id === activeCollectionId
          return (
            <button
              key={c.id}
              onClick={() => onSelectCollection(c.id)}
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: 9,
                padding: '7px 11px',
                background: isActive ? theme.yellow : theme.panel,
                color: isActive ? theme.ink : theme.text,
                border: `1px solid ${isActive ? theme.yellow : theme.panelBorder}`,
                fontSize: 13,
                fontWeight: 700,
                whiteSpace: 'nowrap',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      <div style={{ height: 1, background: theme.panelBorder }} />

      <button
        onClick={onToggleAutoPlay}
        title="Cycle through the diagrams automatically — pause to explain one"
        style={{
          cursor: 'pointer',
          textAlign: 'left',
          borderRadius: 9,
          padding: '8px 11px',
          background: autoPlay ? theme.yellow : theme.panel,
          color: autoPlay ? theme.ink : theme.text,
          border: `1px solid ${autoPlay ? theme.yellow : theme.panelBorder}`,
          fontSize: 13,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 12 }}>{autoPlay ? '⏸' : '▶'}</span>
        {autoPlay ? 'Pause auto-play' : 'Auto-play'}
      </button>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {diagrams.map((d) => {
          const isActive = d.id === activeId
          return (
            <button
              key={d.id}
              onClick={() => onSelect(d.id)}
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: 9,
                padding: '9px 11px',
                background: isActive ? theme.yellow : 'transparent',
                color: isActive ? theme.ink : theme.text,
                border: `1px solid ${isActive ? theme.yellow : theme.panelBorder}`,
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1.25,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {d.title}
            </button>
          )
        })}
      </nav>

      {active && (
        <p
          style={{
            fontSize: 11.5,
            lineHeight: 1.5,
            color: theme.textMuted,
            margin: 0,
            marginTop: 'auto',
            display: '-webkit-box',
            WebkitLineClamp: 6,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {active.description}
        </p>
      )}
    </div>
  )

  // Pinned open: docked sidebar that reserves its width and pushes the canvas.
  if (!collapsed) {
    return (
      <aside
        className="app-sidebar"
        style={{
          width: WIDTH,
          flexShrink: 0,
          height: '100%',
          background: theme.inkSoft,
          borderRight: `1px solid ${theme.panelBorder}`,
        }}
      >
        {fullMenu}
      </aside>
    )
  }

  // Auto-collapse: a slim rail that only reserves RAIL px; hovering expands the full menu as an
  // overlay (so the canvas never reflows) and it collapses again when the pointer leaves.
  return (
    <aside
      className="app-sidebar"
      style={{ width: RAIL, flexShrink: 0, height: '100%', position: 'relative', zIndex: 20 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: hover ? WIDTH : RAIL,
          background: theme.inkSoft,
          borderRight: `1px solid ${theme.panelBorder}`,
          overflow: 'hidden',
          transition: 'width 0.16s ease',
          boxShadow: hover ? '8px 0 28px rgba(0,0,0,0.55)' : 'none',
        }}
      >
        {hover ? (
          fullMenu
        ) : (
          <div style={railWrap}>
            <span
              aria-label="ClickHouse"
              style={{ width: 26, height: 26, display: 'block', flexShrink: 0 }}
              dangerouslySetInnerHTML={{ __html: icons.clickhouse }}
            />
            <span style={{ ...pinBtnStyle, cursor: 'default' }} title="Hover to open">☰</span>
          </div>
        )}
      </div>
    </aside>
  )
}
