// "Data Stack" view — a layered platform overview (not a React Flow node graph): external actors
// on top, the ClickHouse-centered platform (UIs / DBs / Stream) in the middle with an LLMs column
// alongside, and data sources beneath. Connector arrows pulse with the shared animation clock so it
// looks alive and exports to a GIF like the other diagrams.

import { theme } from '../theme'
import { iconSvg } from '../icons'
import { useProgress } from '../animation/useClock'

const TAU = Math.PI * 2

// Layout constants. The personas row and the bottom sources row span the platform's width only
// (i.e. full width minus the LLMs column + the horizontal connector that reaches it), so columns
// stay aligned. Bump these to give the data flow more breathing room.
const LLMS_W = 120
const HCONN_LEN = 96
const OFFSET = LLMS_W + HCONN_LEN

function Ico({ k, size = 28, recolor }: { k: string; size?: number; recolor?: string }) {
  const raw = iconSvg(k)
  if (!raw) return null
  // Some marks (ClickHouse / ClickPipes) are brand-yellow and vanish on a yellow block — recolor them.
  const svg = recolor ? raw.replace(/#faff69/gi, recolor) : raw
  return <span style={{ width: size, height: size, display: 'block', flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: svg }} />
}

type Tone = 'yellow' | 'dark'

function Block({
  icon,
  label,
  sub,
  tone = 'dark',
  style,
  iconSize = 30,
  labelSize = 17,
}: {
  icon: string
  label: string
  sub?: string
  tone?: Tone
  style?: React.CSSProperties
  iconSize?: number
  labelSize?: number
}) {
  const yellow = tone === 'yellow'
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        borderRadius: 12,
        padding: '12px 16px',
        background: yellow ? theme.yellow : 'linear-gradient(160deg,#33333a 0%,#26262b 100%)',
        color: yellow ? theme.ink : theme.text,
        border: `1px solid ${yellow ? theme.yellow : theme.panelBorder}`,
        boxShadow: yellow ? `0 0 18px ${theme.yellow}33` : '0 4px 14px rgba(0,0,0,0.4)',
        ...style,
      }}
    >
      <Ico k={icon} size={iconSize} />
      <div style={{ minWidth: 0, lineHeight: 1.2 }}>
        <div style={{ fontSize: labelSize, fontWeight: 800 }}>{label}</div>
        {sub && (
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, opacity: yellow ? 0.65 : 0.75 }}>{sub}</div>
        )}
      </div>
    </div>
  )
}

// A dashed "group" container (the top/bottom source rows and the LLMs column).
function Group({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        border: `1.5px dashed ${theme.textMuted}88`,
        borderRadius: 16,
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function Actor({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: theme.text }}>
      {icon === 'api' ? (
        <span style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 24, fontWeight: 800, color: theme.text }}>&lt;/&gt;</span>
      ) : (
        <Ico k={icon} size={30} />
      )}
      <span style={{ fontSize: 19, fontWeight: 800 }}>{label}</span>
    </div>
  )
}

// Animated connector: a line with dots flowing both ways + arrowheads, driven by the clock.
function Connector({ dir, length, label }: { dir: 'v' | 'h'; length: number; label?: string }) {
  const t = useProgress()
  const vertical = dir === 'v'
  const W = vertical ? 26 : length
  const H = vertical ? length : 26
  const c = vertical ? W / 2 : H / 2 // cross-axis center
  const accent = theme.textMuted

  const dots: React.ReactNode[] = []
  const N = 2
  for (let i = 0; i < N; i++) {
    const down = (t + i / N) % 1
    const up = 1 - ((t + i / N + 0.5) % 1)
    const dp = down * length
    const upp = up * length
    if (vertical) {
      dots.push(<circle key={`d${i}`} cx={c} cy={dp} r={3} fill={theme.yellow} opacity={0.9} />)
      dots.push(<circle key={`u${i}`} cx={c} cy={upp} r={3} fill={accent} opacity={0.7} />)
    } else {
      dots.push(<circle key={`d${i}`} cx={dp} cy={c} r={3} fill={theme.yellow} opacity={0.9} />)
      dots.push(<circle key={`u${i}`} cx={upp} cy={c} r={3} fill={accent} opacity={0.7} />)
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    <svg width={W} height={H} style={{ display: 'block', flexShrink: 0 }}>
      {vertical ? (
        <>
          <line x1={c} y1={6} x2={c} y2={length - 6} stroke={accent} strokeWidth={2} />
          <path d={`M${c - 5} 9 L${c} 2 L${c + 5} 9`} fill="none" stroke={accent} strokeWidth={2} />
          <path d={`M${c - 5} ${length - 9} L${c} ${length - 2} L${c + 5} ${length - 9}`} fill="none" stroke={accent} strokeWidth={2} />
        </>
      ) : (
        <>
          <line x1={6} y1={c} x2={length - 6} y2={c} stroke={accent} strokeWidth={2} />
          <path d={`M9 ${c - 5} L2 ${c} L9 ${c + 5}`} fill="none" stroke={accent} strokeWidth={2} />
          <path d={`M${length - 9} ${c - 5} L${length - 2} ${c} L${length - 9} ${c + 5}`} fill="none" stroke={accent} strokeWidth={2} />
        </>
      )}
      {dots}
    </svg>
      {label && (
        <span
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            fontSize: 9.5,
            fontWeight: 700,
            color: theme.text,
            background: theme.inkSoft,
            border: `1px solid ${theme.panelBorder}`,
            borderRadius: 999,
            padding: '2px 8px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}

// A persona card (the human role) sitting above the UI tool it uses.
function Persona({ icon, role }: { icon: string; role: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderRadius: 12,
        padding: '10px 14px',
        background: theme.inkSoft,
        border: `1px solid ${theme.panelBorder}`,
        color: theme.text,
      }}
    >
      <Ico k={icon} size={26} />
      <span style={{ fontSize: 16, fontWeight: 800 }}>{role}</span>
    </div>
  )
}

// One column of the persona→UI interaction: the action label + a short downward connector,
// aligned over the UI block beneath it.
function IntoCol({ label }: { label: string }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          color: theme.textMuted,
          background: theme.inkSoft,
          border: `1px solid ${theme.panelBorder}`,
          borderRadius: 999,
          padding: '2px 9px',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <Connector dir="v" length={40} />
    </div>
  )
}

// Left rail label for each platform row (UIs / DBs / Stream).
function RowLabel({ text }: { text: string }) {
  return (
    <div style={{ width: 64, flexShrink: 0, fontSize: 15, fontWeight: 800, color: theme.text }}>{text}</div>
  )
}

export function StackDiagram() {
  const t = useProgress()
  const pulse = 0.5 + 0.5 * Math.sin(TAU * t)

  return (
    <div
      className="stack-root"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.ink,
        overflow: 'auto',
      }}
    >
      <div style={{ width: 1440, maxWidth: '96%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 0, padding: 28 }}>
        {/* Personas — who uses each UI, and how. Aligned to the UI columns of the platform below. */}
        <div
          style={{
            width: `calc(100% - ${OFFSET}px)`,
            boxSizing: 'border-box',
            padding: '0 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ width: 64, flexShrink: 0 }} />
            <Persona icon="people" role="Data Analyst" />
            <Persona icon="user" role="SRE" />
            <Persona icon="user" role="AI Engineer" />
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ width: 64, flexShrink: 0 }} />
            <IntoCol label="Explore data in plain English" />
            <IntoCol label="Monitor infra & APM" />
            <IntoCol label="Track chatbot quality" />
          </div>
        </div>

        {/* Middle: platform + LLMs column */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
          <div
            style={{
              flex: 1,
              border: `1.5px dashed ${theme.yellow}aa`,
              borderRadius: 18,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            {/* UIs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <RowLabel text="UIs" />
              <Block icon="librechat" label="LibreChat" sub="Agentic AI" style={{ flex: 1 }} />
              <Block icon="hyperdx" label="HyperDX" sub="O11Y" tone="yellow" style={{ flex: 1 }} />
              <Block icon="langfuse" label="Langfuse" sub="LLM O11Y" style={{ flex: 1 }} />
            </div>

            {/* DBs */}
            <div style={{ display: 'flex', alignItems: 'stretch', gap: 20 }}>
              <RowLabel text="DBs" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: 300 }}>
                {[0, 1, 2, 3].map((i) => (
                  <Block key={i} icon="postgres" label="Managed Postgres" tone="yellow" iconSize={24} labelSize={13} style={{ padding: '12px 12px' }} />
                ))}
              </div>
              {/* Bidirectional CDC sync between Managed Postgres and ClickHouse (kept in sync) */}
              <Connector dir="h" length={88} label="CDC sync" />
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 20,
                  borderRadius: 14,
                  background: theme.yellow,
                  border: `1px solid ${theme.yellow}`,
                  boxShadow: `0 0 ${18 + pulse * 16}px ${theme.yellow}${pulse > 0.5 ? '66' : '44'}`,
                  color: theme.ink,
                }}
              >
                <Ico k="clickhouse" size={52} recolor={theme.ink} />
                <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: -0.5 }}>ClickHouse</span>
              </div>
              {/* ClickHouse MCP server — the agent's tool surface, right beside ClickHouse */}
              <div
                style={{
                  width: 124,
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  borderRadius: 14,
                  background: theme.yellow,
                  border: `1px solid ${theme.yellow}`,
                  color: theme.ink,
                }}
              >
                <Ico k="server" size={30} />
                <span style={{ fontSize: 18, fontWeight: 800 }}>MCP</span>
                <span style={{ fontSize: 10, fontWeight: 700, opacity: 0.65, textAlign: 'center' }}>ClickHouse tools</span>
              </div>
            </div>

            {/* Stream */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <RowLabel text="Stream" />
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  borderRadius: 12,
                  padding: '14px',
                  background: theme.yellow,
                  border: `1px solid ${theme.yellow}`,
                  color: theme.ink,
                }}
              >
                <Ico k="clickpipes" size={26} recolor={theme.ink} />
                <span style={{ fontSize: 22, fontWeight: 800 }}>ClickPipes</span>
              </div>
            </div>
          </div>

          {/* Connectors to the Agent: a tool call to the ClickHouse MCP (aligned with the DBs row)
              and traces up to Langfuse (aligned with the UIs row). */}
          <div style={{ position: 'relative', width: HCONN_LEN, flexShrink: 0, alignSelf: 'stretch' }}>
            <div style={{ position: 'absolute', top: '17%', left: 0, right: 0, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center' }}>
              <Connector dir="h" length={HCONN_LEN} label="Traces" />
            </div>
            <div style={{ position: 'absolute', top: '51%', left: 0, right: 0, transform: 'translateY(-50%)', display: 'flex', justifyContent: 'center' }}>
              <Connector dir="h" length={HCONN_LEN} label="Tool call" />
            </div>
          </div>

          {/* LLMs column */}
          <Group style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, width: LLMS_W }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: theme.text }}>Agent</span>
            <Ico k="robot" size={38} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, color: theme.textMuted }}>LLMs</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
              <Ico k="openai" size={26} />
              <Ico k="anthropic" size={24} />
              <Ico k="vertexai" size={24} />
            </div>
          </Group>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {/* offset to align under the platform (not the LLMs column) */}
          <div style={{ width: `calc(100% - ${OFFSET}px)`, display: 'flex', justifyContent: 'center' }}>
            <Connector dir="v" length={64} label="ClickPipes ingest" />
          </div>
        </div>

        {/* Bottom: data sources */}
        <Group style={{ width: `calc(100% - ${OFFSET}px)`, display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <Actor icon="objectstorage" label="Open Table Formats" />
          <Actor icon="server" label="Data Lake" />
          <Actor icon="docs" label="Other Sources" />
        </Group>
      </div>
    </div>
  )
}
