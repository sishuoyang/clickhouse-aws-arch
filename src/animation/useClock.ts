import { useSyncExternalStore } from 'react'
import { clock } from './clock'

/** Subscribe to the looping animation progress in [0, 1). Re-renders each frame. */
export function useProgress(): number {
  return useSyncExternalStore(clock.subscribeProgress, clock.getProgress)
}

/** Subscribe to playback controls (playing / speed). Re-renders only on control changes. */
export function useClockControls() {
  const playing = useSyncExternalStore(clock.subscribeMeta, clock.getPlaying)
  const speed = useSyncExternalStore(clock.subscribeMeta, clock.getSpeed)
  return {
    playing,
    speed,
    play: () => clock.setPlaying(true),
    pause: () => clock.setPlaying(false),
    toggle: () => clock.setPlaying(!playing),
    setSpeed: (s: number) => clock.setSpeed(s),
    restart: () => clock.restart(),
  }
}
