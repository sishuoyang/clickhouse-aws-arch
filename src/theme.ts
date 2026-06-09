// ClickHouse brand tokens shared across components and used to drive node/edge styling.

export const theme = {
  // Core brand
  yellow: '#FAFF69', // ClickHouse signature yellow
  yellowDeep: '#F5D90A',
  ink: '#1A1A1A', // near-black
  inkSoft: '#242424',
  panel: '#1E1E1E',
  panelBorder: '#333333',
  text: '#F5F5F5',
  textMuted: '#9A9A9A',

  // Stage / category accents (left -> right through the pipeline)
  category: {
    source: '#7FB3FF', // cool blue — origins
    ingest: '#FF9E64', // AWS-orange — ingestion / tools
    clickhouse: '#FAFF69', // brand yellow — the hub
    consume: '#74E0A8', // green — consumers
    agent: '#B79CFF', // violet — agent runtime / AgentCore platform
  },
} as const

export type Category = keyof typeof theme.category
