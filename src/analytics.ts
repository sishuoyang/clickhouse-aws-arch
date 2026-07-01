// Google Analytics 4 (gtag.js) loader.
//
// Active only when a Measurement ID is provided at build time via VITE_GA_ID (e.g. G-XXXXXXXXXX),
// and never during GIF capture (?capture=1) — so the headless renderer doesn't pollute your traffic.
// Get the Measurement ID by creating a GA4 property + Web data stream (GA Admin UI or the Analytics
// Admin API); it is not something the gcloud CLI can mint.
export function initAnalytics(capture: boolean): void {
  const id = import.meta.env.VITE_GA_ID
  if (!id || capture) return

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
  document.head.appendChild(s)

  const w = window as unknown as { dataLayer: unknown[]; gtag: (...args: unknown[]) => void }
  w.dataLayer = w.dataLayer || []
  // gtag must use a real `arguments` object, so this is a function expression, not an arrow.
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer.push(arguments)
  }
  w.gtag('js', new Date())
  w.gtag('config', id)
}
