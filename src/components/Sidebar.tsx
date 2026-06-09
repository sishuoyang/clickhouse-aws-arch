import { theme } from '../theme'
import { diagrams } from '../diagrams'
import { icons } from '../icons'

export function Sidebar({
  activeId,
  onSelect,
  autoPlay,
  onToggleAutoPlay,
}: {
  activeId: string
  onSelect: (id: string) => void
  autoPlay: boolean
  onToggleAutoPlay: () => void
}) {
  const active = diagrams.find((d) => d.id === activeId)
  return (
    <aside
      className="app-sidebar"
      style={{
        width: 300,
        flexShrink: 0,
        height: '100%',
        background: theme.inkSoft,
        borderRight: `1px solid ${theme.panelBorder}`,
        display: 'flex',
        flexDirection: 'column',
        padding: 20,
        gap: 18,
        overflowY: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          aria-label="ClickHouse"
          style={{ width: 30, height: 30, display: 'block', flexShrink: 0 }}
          dangerouslySetInnerHTML={{ __html: icons.clickhouse }}
        />
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.25 }}>
          ClickHouse on AWS
          <div style={{ fontSize: 11, color: theme.textMuted, fontWeight: 500 }}>
            Reference Architectures
          </div>
        </div>
      </div>

      <button
        onClick={onToggleAutoPlay}
        title="Cycle through the use cases automatically — pause to explain one"
        style={{
          cursor: 'pointer',
          textAlign: 'left',
          borderRadius: 12,
          padding: '11px 14px',
          background: autoPlay ? theme.yellow : theme.panel,
          color: autoPlay ? theme.ink : theme.text,
          border: `1px solid ${autoPlay ? theme.yellow : theme.panelBorder}`,
          fontSize: 14,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 13 }}>{autoPlay ? '⏸' : '▶'}</span>
        {autoPlay ? 'Pause auto-play' : 'Auto-play use cases'}
      </button>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {diagrams.map((d) => {
          const isActive = d.id === activeId
          return (
            <button
              key={d.id}
              onClick={() => onSelect(d.id)}
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                borderRadius: 12,
                padding: '12px 14px',
                background: isActive ? theme.yellow : 'transparent',
                color: isActive ? theme.ink : theme.text,
                border: `1px solid ${isActive ? theme.yellow : theme.panelBorder}`,
                fontSize: 14,
                fontWeight: 600,
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
            fontSize: 12.5,
            lineHeight: 1.5,
            color: theme.textMuted,
            margin: 0,
            marginTop: 'auto',
          }}
        >
          {active.description}
        </p>
      )}
    </aside>
  )
}
