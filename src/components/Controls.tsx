import { theme } from '../theme'
import { useClockControls } from '../animation/useClock'

const SPEEDS = [0.5, 1, 2]

export function Controls({ title, diagramId }: { title: string; diagramId: string }) {
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

  const kbd: React.CSSProperties = {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 10.5,
    fontWeight: 700,
    color: theme.text,
    background: theme.panel,
    border: `1px solid ${theme.panelBorder}`,
    borderRadius: 5,
    padding: '2px 6px',
    lineHeight: 1,
  }
  const Hint = ({ keys, label }: { keys: string[]; label: string }) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      {keys.map((k) => (
        <kbd key={k} style={kbd}>
          {k}
        </kbd>
      ))}
      <span style={{ fontSize: 11.5, color: theme.textMuted }}>{label}</span>
    </span>
  )

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

      {/* Keyboard shortcuts */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: theme.panel,
          border: `1px solid ${theme.panelBorder}`,
          borderRadius: 10,
          padding: '7px 14px',
        }}
      >
        <Hint keys={['Space']} label="Auto-play" />
        <Hint keys={['↑', '↓']} label="Diagram" />
        <Hint keys={['1', '–', '4']} label="View" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <a
          href={`/gifs/${diagramId}.gif`}
          download={`${diagramId}.gif`}
          title="Download this diagram as an animated GIF (for slides)"
          style={{ ...btn, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          ⬇ GIF
        </a>
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
