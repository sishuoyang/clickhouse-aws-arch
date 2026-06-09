import { theme } from '../theme'
import { useClockControls } from '../animation/useClock'

const SPEEDS = [0.5, 1, 2]

export function Controls({ title }: { title: string }) {
  const { playing, speed, toggle, restart, setSpeed } = useClockControls()

  const btn: React.CSSProperties = {
    cursor: 'pointer',
    border: `1px solid ${theme.panelBorder}`,
    background: theme.panel,
    color: theme.text,
    borderRadius: 10,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
  }

  return (
    <div
      className="app-controls"
      style={{
        position: 'absolute',
        top: 18,
        left: 24,
        right: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        zIndex: 5,
      }}
    >
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{title}</h1>
        <div style={{ fontSize: 11.5, color: theme.textMuted, marginTop: 2 }}>
          Drag nodes or edge ends to arrange, then <strong>Save layout</strong> (top-right) to set the default.
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={btn} onClick={toggle}>
          {playing ? '⏸ Pause' : '▶ Play'}
        </button>
        <button style={btn} onClick={restart}>
          ↺ Restart
        </button>
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: theme.panel,
            border: `1px solid ${theme.panelBorder}`,
            borderRadius: 10,
            padding: 4,
          }}
        >
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              style={{
                cursor: 'pointer',
                border: 'none',
                borderRadius: 7,
                padding: '5px 10px',
                fontSize: 12.5,
                fontWeight: 600,
                background: speed === s ? theme.yellow : 'transparent',
                color: speed === s ? theme.ink : theme.textMuted,
              }}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
