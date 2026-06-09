import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { clock } from './animation/clock'
import { diagrams } from './diagrams'

const params = new URLSearchParams(window.location.search)
const capture = params.get('capture') === '1'
if (capture) document.body.classList.add('capture')

// Expose the diagram list so the GIF render script has a single source of truth.
;(window as unknown as Record<string, unknown>).__diagrams = diagrams.map((d) => ({
  id: d.id,
  title: d.title,
}))

// Initialize the animation clock for the current mode. In capture mode this installs
// window.__setFrame and leaves the clock paused for frame-by-frame rendering.
clock.init({ capture })

// No StrictMode: it double-invokes effects in dev, which would start a second rAF loop.
createRoot(document.getElementById('root')!).render(<App />)
