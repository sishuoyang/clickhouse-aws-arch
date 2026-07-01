import { useEffect, useState } from 'react'
import { DiagramCanvas } from './components/DiagramCanvas'
import { StackDiagram } from './components/StackDiagram'
import { Sidebar } from './components/Sidebar'
import { Controls } from './components/Controls'
import { diagramById, defaultDiagramId, diagrams, collections, collectionOf } from './diagrams'

function readParams() {
  const p = new URLSearchParams(window.location.search)
  return { capture: p.get('capture') === '1', diagram: p.get('diagram') }
}

// How long each use case is shown during auto-play (ms).
const AUTOPLAY_INTERVAL = 8000

export default function App() {
  const { capture, diagram } = readParams()
  const initial = diagram && diagramById[diagram] ? diagram : defaultDiagramId
  const [activeId, setActiveId] = useState(initial)
  const [autoPlay, setAutoPlay] = useState(false)
  // Auto-collapse by default (slim rail that expands on hover); only stays pinned-open if the user
  // explicitly chose that (persisted as '0').
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') !== '0',
  )
  const toggleCollapsed = () =>
    setCollapsed((v) => {
      const next = !v
      localStorage.setItem('sidebar-collapsed', next ? '1' : '0')
      return next
    })
  const active = diagramById[activeId] ?? diagrams[0]
  const activeCollection = collectionOf(activeId)

  const onSelectCollection = (id: string) => {
    const c = collections.find((x) => x.id === id)
    if (c) setActiveId(c.diagrams[0].id)
  }

  // Keep the URL in sync so a diagram can be deep-linked (interactive mode only).
  useEffect(() => {
    if (capture) return
    const u = new URL(window.location.href)
    u.searchParams.set('diagram', activeId)
    window.history.replaceState({}, '', u)
  }, [activeId, capture])

  // Auto-play: cycle through the current view's diagrams one by one. Keyed on activeId so each
  // diagram (whether reached automatically or by a manual click) gets the full interval.
  useEffect(() => {
    if (capture || !autoPlay) return
    const t = setTimeout(() => {
      const list = collectionOf(activeId).diagrams
      const idx = list.findIndex((d) => d.id === activeId)
      setActiveId(list[(idx + 1) % list.length].id)
    }, AUTOPLAY_INTERVAL)
    return () => clearTimeout(t)
  }, [autoPlay, activeId, capture])

  // Keyboard shortcuts: Space toggles auto-play, ↑/↓ step through the 4 diagrams in the current
  // view, and 1–4 switch the view (collection). Ignored while typing or in capture mode.
  useEffect(() => {
    if (capture) return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const tag = el?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        // blur any focused button so the same Space press doesn't also re-trigger it
        ;(document.activeElement as HTMLElement | null)?.blur()
        setAutoPlay((v) => !v)
        return
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const list = collectionOf(activeId).diagrams
        const idx = list.findIndex((d) => d.id === activeId)
        const next =
          e.key === 'ArrowDown'
            ? (idx + 1) % list.length
            : (idx - 1 + list.length) % list.length
        setActiveId(list[next].id)
        return
      }
      // Digit 1–9 from the number row or numpad (read e.code too, since a focused React Flow node
      // can otherwise consume the keypress).
      let digit = ''
      if (e.key >= '1' && e.key <= '9') digit = e.key
      else if (/^(Digit|Numpad)[1-9]$/.test(e.code)) digit = e.code.slice(-1)
      if (digit) {
        const i = Number(digit) - 1
        if (i < collections.length) {
          e.preventDefault()
          setActiveId(collections[i].diagrams[0].id)
        }
      }
    }
    // Capture phase so the shortcut fires before React Flow / focused elements can swallow the key.
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [activeId, capture])

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%' }}>
      {!capture && (
        <Sidebar
          collections={collections}
          activeCollectionId={activeCollection.id}
          onSelectCollection={onSelectCollection}
          diagrams={activeCollection.diagrams}
          activeId={activeId}
          onSelect={setActiveId}
          autoPlay={autoPlay}
          onToggleAutoPlay={() => setAutoPlay((v) => !v)}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
      )}
      <main style={{ position: 'relative', flex: 1, height: '100%' }}>
        {!capture && <Controls title={active.title} diagramId={active.id} />}
        <div style={{ position: 'absolute', inset: 0 }}>
          {active.kind === 'stack' ? (
            <StackDiagram />
          ) : (
            <DiagramCanvas diagram={active} capture={capture} />
          )}
        </div>
      </main>
    </div>
  )
}
