// Rendering defaults for the GIF export. Override per-diagram in `perDiagram`.
export const defaults = {
  width: 1600,
  height: 900,
  fps: 20,
  durationSeconds: 5, // loop length -> frames = fps * durationSeconds
}

// Per-diagram overrides keyed by diagram id (must match src/diagrams ids).
// Example: { 'ml-genai': { durationSeconds: 6 } }
export const perDiagram = {}

export function settingsFor(id) {
  const s = { ...defaults, ...(perDiagram[id] ?? {}) }
  s.frames = Math.round(s.fps * s.durationSeconds)
  return s
}
