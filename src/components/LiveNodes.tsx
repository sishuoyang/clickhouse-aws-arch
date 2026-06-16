// Animated, story-telling nodes for the non-technical "use case" diagrams. Every value here is a
// pure function of the shared looping clock (useProgress, 0..1) so the motion is deterministic and
// is captured frame-by-frame into the exported GIF — exactly like the particle edges.

import { Handle, Position, type NodeProps } from '@xyflow/react'
import { theme } from '../theme'
import { iconSvg } from '../icons'
import { useProgress } from '../animation/useClock'
import type { ServiceNode as ServiceNodeType } from '../diagrams/types'

const TAU = Math.PI * 2
const easeOut = (x: number) => 1 - (1 - x) * (1 - x)
const wrap = (x: number) => ((x % 1) + 1) % 1

// Smooth raised-cosine bump: 1 at center `c`, 0 beyond half-width `w`. Used to script a transient
// "incident" inside the loop that fully recovers before it wraps, so the animation stays seamless.
function bump(t: number, c: number, w: number): number {
  const d = Math.abs(t - c)
  if (d > w) return 0
  return 0.5 + 0.5 * Math.cos((Math.PI * d) / w)
}

const handleStyle: React.CSSProperties = {
  width: 10,
  height: 10,
  background: theme.yellow,
  border: `2px solid ${theme.ink}`,
  borderRadius: '50%',
}

// Same 8 handles as ServiceNode so edges attach and stay reconnectable on every side.
function NodeHandles() {
  return (
    <>
      <Handle id="l" type="target" position={Position.Left} style={handleStyle} />
      <Handle id="tr" type="target" position={Position.Right} style={handleStyle} />
      <Handle id="t" type="target" position={Position.Top} style={handleStyle} />
      <Handle id="b" type="target" position={Position.Bottom} style={handleStyle} />
      <Handle id="r" type="source" position={Position.Right} style={handleStyle} />
      <Handle id="sl" type="source" position={Position.Left} style={handleStyle} />
      <Handle id="st" type="source" position={Position.Top} style={handleStyle} />
      <Handle id="sb" type="source" position={Position.Bottom} style={handleStyle} />
    </>
  )
}

const num: React.CSSProperties = { fontVariantNumeric: 'tabular-nums' }

/**
 * A low-fidelity but genuinely live dashboard: two KPI tiles whose numbers tick up and down with a
 * ▲/▼ delta, a bar chart whose bars rise and fall (the current peak lights up "just updated"), and
 * a scrolling sparkline. Reads as a real dashboard refreshing in real time.
 */
export function LiveDashboardNode({ data }: NodeProps<ServiceNodeType>) {
  const t = useProgress()
  const accent = theme.category.consume

  const revenue = Math.round(1180 + 240 * Math.sin(TAU * t) + 70 * Math.sin(TAU * 2 * t + 1))
  const visitors = Math.round(640 + 130 * Math.sin(TAU * t + 2.1) + 35 * Math.sin(TAU * 3 * t))
  const revUp = Math.cos(TAU * t) >= 0
  const visUp = Math.cos(TAU * t + 2.1) >= 0

  const N = 7
  const heights = Array.from({ length: N }, (_, i) => {
    const v = 0.5 + 0.5 * Math.sin(TAU * (t + i / N) + i * 0.6)
    return 0.2 + 0.8 * v
  })
  let peak = 0
  for (let i = 1; i < N; i++) if (heights[i] > heights[peak]) peak = i

  // Scrolling sparkline — integer cycle count keeps the loop seamless as t wraps 0→1.
  const SW = 270
  const SH = 30
  const PTS = 28
  const CYCLES = 2
  const spark = Array.from({ length: PTS }, (_, k) => {
    const f = k / (PTS - 1)
    const x = f * SW
    const y = SH / 2 - (SH / 2 - 2.5) * Math.sin(TAU * (f * CYCLES + t))
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const livePulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(TAU * 2 * t))

  return (
    <div
      style={{
        width: 300,
        borderRadius: 16,
        background: 'linear-gradient(160deg,#20231f 0%,#191a17 100%)',
        border: `2px solid ${accent}`,
        boxShadow: `0 0 0 1px ${accent}22, 0 8px 24px rgba(0,0,0,0.5)`,
        color: theme.text,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 11,
      }}
    >
      <NodeHandles />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{data.label ?? 'Live Dashboard'}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: accent,
              opacity: livePulse,
              boxShadow: `0 0 8px ${accent}`,
            }}
          />
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: accent }}>LIVE</span>
        </div>
      </div>

      {/* KPI tiles */}
      <div style={{ display: 'flex', gap: 9 }}>
        <Kpi label="Revenue / min" value={`$${revenue.toLocaleString('en-US')}`} up={revUp} accent={accent} />
        <Kpi label="Visitors now" value={visitors.toLocaleString('en-US')} up={visUp} accent={accent} />
      </div>

      {/* Bar chart */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 46 }}>
        {heights.map((h, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${Math.round(h * 100)}%`,
              borderRadius: 3,
              background: i === peak ? theme.yellow : `${accent}aa`,
              boxShadow: i === peak ? `0 0 10px ${theme.yellow}aa` : 'none',
              transition: 'none',
            }}
          />
        ))}
      </div>

      {/* Sparkline */}
      <svg width="100%" viewBox={`0 0 ${SW} ${SH}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <polyline points={spark} fill="none" stroke={accent} strokeWidth={2} strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function Kpi({ label, value, up, accent }: { label: string; value: string; up: boolean; accent: string }) {
  const upColor = accent
  const downColor = '#FF8FA3'
  return (
    <div
      style={{
        flex: 1,
        background: '#ffffff0a',
        border: `1px solid ${theme.panelBorder}`,
        borderRadius: 10,
        padding: '7px 9px',
      }}
    >
      <div style={{ fontSize: 10, color: theme.textMuted, marginBottom: 2 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ ...num, fontSize: 19, fontWeight: 800, color: theme.text }}>{value}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: up ? upColor : downColor }}>
          {up ? '▲' : '▼'}
        </span>
      </div>
    </div>
  )
}

const TEAM_ACTIONS = [
  'Restocking the best-seller',
  'Launching a flash deal',
  'Opening more checkouts',
  'Rerouting popular stock',
]

/**
 * The store team visibly reacting to the live data: a pulsing "new data" ring around the team, an
 * action ticker that pops to a new response on each beat, and three teammate dots that light up in
 * sequence to show activity.
 */
export function StoreTeamNode({ data }: NodeProps<ServiceNodeType>) {
  const t = useProgress()
  const accent = theme.category.consume
  const svg = iconSvg(data.icon ?? 'user')

  const slot = t * TEAM_ACTIONS.length
  const idx = Math.floor(slot) % TEAM_ACTIONS.length
  const frac = slot - Math.floor(slot)

  // Pop the new action in over the first ~18% of each beat; ring expands & fades over the first half.
  const pop = easeOut(Math.min(1, frac / 0.18))
  const popScale = 0.92 + 0.08 * pop
  const ring = Math.max(0, 1 - frac / 0.5)
  const ringScale = 1 + 0.9 * (1 - ring)

  const active = Math.floor(t * 3 * TEAM_ACTIONS.length) % 3

  return (
    <div
      style={{
        width: 240,
        borderRadius: 16,
        background: theme.panel,
        border: `2px solid ${accent}`,
        boxShadow: `0 0 0 1px ${accent}22, 0 8px 24px rgba(0,0,0,0.5)`,
        color: theme.text,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 11,
      }}
    >
      <NodeHandles />

      {/* Header: person glyph with a pulsing "incoming data" ring */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
          <span
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `2px solid ${accent}`,
              opacity: ring * 0.7,
              transform: `scale(${ringScale})`,
            }}
          />
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: '#ffffff0d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 6,
            }}
          >
            {svg ? (
              <span style={{ width: '100%', height: '100%', display: 'block' }} dangerouslySetInnerHTML={{ __html: svg }} />
            ) : (
              <span>◆</span>
            )}
          </div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{data.label ?? 'Store Team'}</div>
          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>
            {data.sub ?? 'Reacting in real time'}
          </div>
        </div>
      </div>

      {/* Action ticker — pops to the next reaction each beat */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: `${accent}14`,
          border: `1px solid ${accent}55`,
          borderRadius: 10,
          padding: '8px 10px',
          transform: `scale(${popScale})`,
          transformOrigin: 'left center',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent, boxShadow: `0 0 8px ${accent}`, flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: theme.text, whiteSpace: 'nowrap' }}>
          {TEAM_ACTIONS[idx]}
        </span>
      </div>

      {/* Teammates lighting up in sequence */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 22,
              height: 6,
              borderRadius: 999,
              background: i === active ? accent : `${accent}33`,
              boxShadow: i === active ? `0 0 8px ${accent}aa` : 'none',
            }}
          />
        ))}
        <span style={{ fontSize: 10.5, color: theme.textMuted, marginLeft: 4 }}>on it</span>
      </div>
    </div>
  )
}

const GREEN = theme.category.consume
const AMBER = '#F5C451'
const RED = '#FF6B6B'

const SERVICES = ['api', 'web', 'auth', 'search', 'cache', 'orders', 'queue', 'cdn']
// One service ('cache') degrades during the incident window; the rest stay healthy.
const INCIDENT_SVC = 4
// The loop represents one day. The human SRE is on shift during WORK_* (daytime), and the scripted
// incident fires AFTER hours (INCIDENT_C) — so the 24/7 AI agent catches it and pages the human.
// These are shared by HealthDashboardNode and OnCallSRENode so the whole story stays in sync.
const WORK_START = 0.2
const WORK_END = 0.62
const INCIDENT_C = 0.8
const INCIDENT_W = 0.1

/**
 * A Kibana-style application-health dashboard. Stat tiles (requests/sec, p95 latency, error rate),
 * a scrolling time-series panel (throughput area + p95 latency line, newest data on the right), and
 * a service-status heat row. A scripted incident spikes latency/errors mid-loop — one service turns
 * amber then red and the status flips to "Degraded" — before everything recovers and the loop wraps.
 */
export function HealthDashboardNode({ data }: NodeProps<ServiceNodeType>) {
  const t = useProgress()
  const inc = bump(t, INCIDENT_C, INCIDENT_W) // 0..1 incident intensity "now"

  const reqPerSec = Math.round(12500 + 2200 * Math.sin(TAU * t * 2) - 6500 * inc)
  const p95 = Math.round(165 + 540 * inc + 12 * Math.sin(TAU * t * 3))
  const errPct = (0.15 + 4.3 * inc).toFixed(2)

  const degraded = inc > 0.35
  const statusColor = inc > 0.6 ? RED : degraded ? AMBER : GREEN
  const statusText = inc > 0.6 ? 'Critical' : degraded ? 'Degraded' : 'Healthy'

  // Scrolling time series: sample a periodic signal across a past window so the incident enters
  // from the right and scrolls left, just like a live Kibana panel.
  const SW = 312
  const SH = 60
  const PTS = 44
  const WIN = 0.55
  const series = (fn: (tau: number) => number) =>
    Array.from({ length: PTS }, (_, k) => {
      const f = k / (PTS - 1)
      const v = fn(wrap(t - WIN * (1 - f)))
      return { x: f * SW, y: (1 - Math.max(0, Math.min(1, v))) * SH }
    })

  const throughput = (tau: number) => 0.62 + 0.16 * Math.sin(TAU * tau * 2) - 0.42 * bump(tau, INCIDENT_C, INCIDENT_W)
  const latency = (tau: number) => 0.18 + 0.72 * bump(tau, INCIDENT_C, INCIDENT_W) + 0.04 * Math.sin(TAU * tau * 4)

  const tp = series(throughput)
  const lt = series(latency)
  const areaPath = `M0,${SH} ` + tp.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ` L${SW},${SH} Z`
  const linePts = lt.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  const livePulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(TAU * 2 * t))

  return (
    <div
      style={{
        width: 340,
        borderRadius: 16,
        background: 'linear-gradient(160deg,#1d211f 0%,#17191a 100%)',
        border: `2px solid ${statusColor}`,
        boxShadow: `0 0 0 1px ${statusColor}22, 0 8px 26px rgba(0,0,0,0.55)`,
        color: theme.text,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <NodeHandles />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{data.label ?? 'Application Health'}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: statusColor,
              opacity: livePulse,
              boxShadow: `0 0 8px ${statusColor}`,
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.4, color: statusColor }}>
            {statusText}
          </span>
        </div>
      </div>

      {/* Stat tiles */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Stat label="Requests / sec" value={reqPerSec.toLocaleString('en-US')} tone={GREEN} />
        <Stat label="p95 latency" value={`${p95} ms`} tone={p95 > 400 ? RED : p95 > 260 ? AMBER : GREEN} />
        <Stat label="Error rate" value={`${errPct}%`} tone={+errPct > 2 ? RED : +errPct > 0.8 ? AMBER : GREEN} />
      </div>

      {/* Scrolling time-series panel */}
      <div style={{ position: 'relative', border: `1px solid ${theme.panelBorder}`, borderRadius: 8, padding: '8px 8px 4px', background: '#00000033' }}>
        <div style={{ fontSize: 9.5, color: theme.textMuted, marginBottom: 3, display: 'flex', gap: 12 }}>
          <span style={{ color: GREEN }}>■ throughput</span>
          <span style={{ color: AMBER }}>■ p95 latency</span>
        </div>
        <svg width="100%" viewBox={`0 0 ${SW} ${SH}`} preserveAspectRatio="none" style={{ display: 'block', height: 60 }}>
          {[0.33, 0.66].map((g) => (
            <line key={g} x1={0} x2={SW} y1={g * SH} y2={g * SH} stroke="#ffffff14" strokeWidth={1} />
          ))}
          <path d={areaPath} fill={`${GREEN}26`} stroke={GREEN} strokeWidth={1.5} strokeLinejoin="round" />
          <polyline points={linePts} fill="none" stroke={AMBER} strokeWidth={1.5} strokeLinejoin="round" />
        </svg>
      </div>

      {/* Service status heat row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {SERVICES.map((name, i) => {
          const c = i === INCIDENT_SVC ? (inc > 0.6 ? RED : inc > 0.2 ? AMBER : GREEN) : GREEN
          return (
            <div key={name} title={name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <span style={{ width: '100%', height: 12, borderRadius: 3, background: c, boxShadow: c !== GREEN ? `0 0 8px ${c}aa` : 'none' }} />
              <span style={{ fontSize: 8, color: theme.textMuted }}>{name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: '#ffffff0a',
        border: `1px solid ${tone === GREEN ? theme.panelBorder : `${tone}88`}`,
        borderRadius: 9,
        padding: '6px 8px',
      }}
    >
      <div style={{ fontSize: 9.5, color: theme.textMuted, marginBottom: 2, whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ ...num, fontSize: 16, fontWeight: 800, color: tone }}>{value}</div>
    </div>
  )
}

/**
 * The human On-call SRE. A 24-hour timeline shows the working-hours window with a moving "now"
 * marker: while it's inside the window the SRE is on shift, eyes on the dashboard. When the
 * after-hours incident fires, the AI SRE agent pages them — the card flashes red, a bell badge
 * buzzes, and the status flips to "Paged — responding" — showing an alert reaching a human.
 */
export function OnCallSRENode({ data }: NodeProps<ServiceNodeType>) {
  const t = useProgress()
  const svg = iconSvg(data.icon ?? 'user')

  const onShift = t >= WORK_START && t <= WORK_END
  const inc = bump(t, INCIDENT_C, INCIDENT_W)
  const paged = inc > 0.4

  // Buzz the bell/person sideways while paged.
  const buzz = paged ? Math.sin(TAU * 16 * t) * 2.4 * inc : 0

  const status = paged
    ? { text: 'Paged — responding', color: RED }
    : onShift
      ? { text: 'On shift · watching', color: GREEN }
      : { text: 'Off shift · AI on watch', color: theme.textMuted }

  const W = 210
  const markerX = t * W

  return (
    <div
      style={{
        width: 238,
        borderRadius: 16,
        background: theme.panel,
        border: `2px solid ${paged ? RED : onShift ? GREEN : theme.panelBorder}`,
        boxShadow: paged
          ? `0 0 0 1px ${RED}33, 0 0 22px ${RED}66`
          : `0 8px 24px rgba(0,0,0,0.5)`,
        color: theme.text,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 11,
      }}
    >
      <NodeHandles />

      {/* Header: person + paging bell */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: 10,
            background: '#ffffff0d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 6,
            transform: `translateX(${buzz.toFixed(2)}px)`,
          }}
        >
          {svg ? (
            <span style={{ width: '100%', height: '100%', display: 'block' }} dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <span>◆</span>
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{data.label ?? 'On-call SRE'}</div>
          <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{data.sub ?? 'A human in the loop'}</div>
        </div>
        {paged && (
          <span
            style={{
              width: 20,
              height: 20,
              flexShrink: 0,
              display: 'block',
              transform: `translateX(${buzz.toFixed(2)}px) rotate(${(buzz * 4).toFixed(1)}deg)`,
            }}
            dangerouslySetInnerHTML={{ __html: iconSvg('alerts') ?? '' }}
          />
        )}
      </div>

      {/* 24h working-hours timeline with a moving "now" marker */}
      <div>
        <div style={{ position: 'relative', height: 12, borderRadius: 6, background: '#ffffff10', overflow: 'hidden' }}>
          {/* working-hours window */}
          <span
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: `${WORK_START * 100}%`,
              width: `${(WORK_END - WORK_START) * 100}%`,
              background: `${GREEN}3a`,
              borderLeft: `1px solid ${GREEN}88`,
              borderRight: `1px solid ${GREEN}88`,
            }}
          />
          {/* now marker */}
          <span
            style={{
              position: 'absolute',
              top: -2,
              bottom: -2,
              left: `calc(${(markerX / W) * 100}% - 1px)`,
              width: 2,
              background: status.color,
              boxShadow: `0 0 8px ${status.color}`,
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: theme.textMuted, marginTop: 3 }}>
          <span>12a</span>
          <span style={{ color: `${GREEN}cc` }}>working hours</span>
          <span>12a</span>
        </div>
      </div>

      {/* Status pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: `${status.color}1f`,
          border: `1px solid ${status.color}66`,
          borderRadius: 10,
          padding: '7px 10px',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: status.color, boxShadow: `0 0 8px ${status.color}`, flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: status.color, whiteSpace: 'nowrap' }}>{status.text}</span>
      </div>
    </div>
  )
}
