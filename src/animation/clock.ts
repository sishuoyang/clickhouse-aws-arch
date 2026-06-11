// A single deterministic animation clock shared by all edges.
//
// `progress` is a value in [0, 1) that loops. In interactive mode it advances via
// requestAnimationFrame. In capture mode (?capture=1) it does NOT auto-advance; instead the
// render script drives it frame-by-frame through window.__setFrame, which makes the exported
// GIF a perfectly smooth, seamless loop.

type Listener = () => void

const LOOP_SECONDS_DEFAULT = 6

class Clock {
  private progress = 0
  private speed = 1
  private playing = true
  private capture = false
  private loopSeconds = LOOP_SECONDS_DEFAULT

  private progressListeners = new Set<Listener>()
  private metaListeners = new Set<Listener>()
  private raf = 0
  private last = 0

  // --- progress (high-frequency) ---
  subscribeProgress = (l: Listener): (() => void) => {
    this.progressListeners.add(l)
    return () => this.progressListeners.delete(l)
  }
  getProgress = (): number => this.progress
  private emitProgress() {
    // Isolate subscribers: one bad listener must not stop the others (or, combined with the
    // schedule-first tick below, kill the animation loop).
    this.progressListeners.forEach((l) => {
      try {
        l()
      } catch (e) {
        console.error('clock progress listener error', e)
      }
    })
  }

  // --- meta: playing / speed (low-frequency, drives the controls UI) ---
  subscribeMeta = (l: Listener): (() => void) => {
    this.metaListeners.add(l)
    return () => this.metaListeners.delete(l)
  }
  getPlaying = (): boolean => this.playing
  getSpeed = (): number => this.speed
  private emitMeta() {
    this.metaListeners.forEach((l) => {
      try {
        l()
      } catch (e) {
        console.error('clock meta listener error', e)
      }
    })
  }

  setProgress(p: number) {
    this.progress = ((p % 1) + 1) % 1
    this.emitProgress()
  }

  setSpeed(s: number) {
    this.speed = s
    this.emitMeta()
  }

  setPlaying(p: boolean) {
    if (this.playing === p) return
    this.playing = p
    this.emitMeta()
    if (p) this.run()
    else this.stop()
  }

  restart() {
    this.setProgress(0)
  }

  private tick = (ts: number) => {
    // Schedule the next frame FIRST so the loop can never be killed by a transient error in
    // setProgress / a subscriber render — that would freeze the animation permanently.
    this.raf = requestAnimationFrame(this.tick)
    if (this.last) {
      // Clamp dt so a long pause (e.g. backgrounded tab) doesn't cause a huge jump on resume.
      const dt = Math.min((ts - this.last) / 1000, 0.1)
      this.setProgress(this.progress + (dt * this.speed) / this.loopSeconds)
    }
    this.last = ts
  }

  private run() {
    if (this.raf) return
    this.last = 0
    this.raf = requestAnimationFrame(this.tick)
  }

  private stop() {
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  /** Initialize the clock for the current mode and wire up capture hooks. */
  init(opts: { capture: boolean; loopSeconds?: number }) {
    this.capture = opts.capture
    if (opts.loopSeconds) this.loopSeconds = opts.loopSeconds
    if (this.capture) {
      this.playing = false
      this.setProgress(0)
      // Expose a deterministic frame setter for the render script. Resolves after React has
      // committed and the browser has painted the frame.
      ;(window as unknown as Record<string, unknown>).__setFrame = (t: number) => {
        this.setProgress(t)
        return new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        )
      }
      ;(window as unknown as Record<string, unknown>).__captureReady = true
    } else {
      this.run()
    }
  }

  get isCapture() {
    return this.capture
  }
}

export const clock = new Clock()
