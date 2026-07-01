/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google Analytics 4 Measurement ID (e.g. G-XXXXXXXXXX). Optional; analytics is off when unset. */
  readonly VITE_GA_ID?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
