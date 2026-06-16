import { type DiagramDef, cnode, edge } from './types'

// Vendor-neutral architectures — the same four use cases built from portable, open-source /
// multi-cloud components (Apache Kafka, PostgreSQL/MySQL/MongoDB, object storage, OpenTelemetry,
// Grafana/Superset, open LLMs) instead of AWS-specific services. ClickHouse is the constant,
// ingesting natively (Kafka table engine, CDC, object-storage table functions).

// 1) Real-time analytics
const R = { SRC: 150, STR: 450, PROC: 760, PIPES: 1030, CH: 1320, VIZ: 1560 }
export const vnRealtime: DiagramDef = {
  id: 'vn-real-time',
  title: 'Real-time Analytics',
  description:
    'High-volume events stream through Apache Kafka (optionally processed by Apache Flink) into ClickHouse via ClickPipes, while Postgres/MySQL are captured by ClickPipes CDC — powering live dashboards and APIs. Portable across any cloud or on-prem; ClickPipes is ClickHouse’s own managed ingestion.',
  stages: [
    { title: 'Data Sources', x: R.SRC },
    { title: 'Streaming', x: R.STR },
    { title: 'Stream Processing', x: R.PROC },
    { title: 'Realtime Data Warehouse', x: (R.PIPES + R.CH) / 2 },
    { title: 'Visualization & APIs', x: R.VIZ },
  ],
  nodes: [
    cnode('apps', R.SRC, 160, { label: 'Applications', sub: 'Clickstream & events', category: 'source', icon: 'apps' }),
    cnode('web', R.SRC, 300, { label: 'Web / APIs', sub: 'User traffic', category: 'source', icon: 'globe' }),
    cnode('services', R.SRC, 440, { label: 'Microservices', sub: 'App events', category: 'source', icon: 'server' }),
    cnode('db', R.SRC, 590, { label: 'PostgreSQL / MySQL', sub: 'Operational DB', category: 'source', icon: 'postgres' }),
    cnode('kafka', R.STR, 330, { label: 'Apache Kafka', sub: 'Streaming platform', category: 'ingest', icon: 'kafka' }),
    cnode('flink', R.PROC, 330, { label: 'Apache Flink', sub: 'Stream processing', category: 'ingest', icon: 'flinkoss' }),
    cnode('clickpipes', R.PIPES, 400, { label: 'ClickPipes', sub: 'Managed ingestion + CDC', category: 'clickhouse', icon: 'clickpipes' }),
    cnode('clickhouse', R.CH, 360, { label: 'ClickHouse', sub: 'Real-time analytics', category: 'clickhouse', icon: 'clickhouse', badge: 'Materialized Views', hero: true }),
    cnode('grafana', R.VIZ, 200, { label: 'Grafana', sub: 'Live dashboards', category: 'consume', icon: 'grafana' }),
    cnode('superset', R.VIZ, 360, { label: 'Apache Superset', sub: 'Exploration', category: 'consume', icon: 'superset' }),
    cnode('apis', R.VIZ, 520, { label: 'Application APIs', sub: 'Customer-facing', category: 'consume', icon: 'apps' }),
  ],
  edges: [
    edge('apps', 'kafka'),
    edge('web', 'kafka'),
    edge('services', 'kafka'),
    edge('kafka', 'clickpipes'),
    // PostgreSQL / MySQL captured by ClickPipes CDC (no direct DB → ClickHouse hop)
    edge('db', 'clickpipes', { label: 'Postgres / MySQL CDC' }, { targetHandle: 'b' }),
    edge('kafka', 'flink', { variant: 'optional' }),
    edge('flink', 'clickhouse', { variant: 'optional', label: 'ClickHouse sink' }, { targetHandle: 't' }),
    edge('clickpipes', 'clickhouse'),
    edge('clickhouse', 'grafana'),
    edge('clickhouse', 'superset'),
    edge('clickhouse', 'apis'),
  ],
}

// 2) Data warehouse
const W = { SRC: 150, ETL: 470, LAKE: 790, CH: 1110, BI: 1430 }
export const vnWarehouse: DiagramDef = {
  id: 'vn-warehouse',
  title: 'Data Warehouse',
  description:
    'Operational databases are captured by ClickPipes CDC while files land in object storage as Apache Iceberg. ClickHouse ingests natively and queries the Iceberg lake in place — serving BI and ad-hoc SQL on any cloud or on-prem.',
  stages: [
    { title: 'Data Sources', x: W.SRC },
    { title: 'Ingestion & CDC', x: W.ETL },
    { title: 'Data Lake', x: W.LAKE },
    { title: 'Data Warehouse', x: W.CH },
    { title: 'BI & Analytics', x: W.BI },
  ],
  nodes: [
    cnode('postgres', W.SRC, 180, { label: 'PostgreSQL', sub: 'Relational DB', category: 'source', icon: 'postgres' }),
    cnode('mysql', W.SRC, 320, { label: 'MySQL', sub: 'Relational DB', category: 'source', icon: 'mysql' }),
    cnode('mongodb', W.SRC, 460, { label: 'MongoDB', sub: 'NoSQL', category: 'source', icon: 'mongodb' }),
    cnode('saas', W.SRC, 600, { label: 'SaaS & Files', sub: 'External data', category: 'source', icon: 'apps' }),
    cnode('clickpipes', W.ETL, 320, { label: 'ClickPipes', sub: 'Managed CDC', category: 'clickhouse', icon: 'clickpipes' }),
    cnode('storage', W.LAKE, 430, { label: 'Object Storage', sub: 'Iceberg data lake', category: 'ingest', icon: 'objectstorage' }),
    cnode('clickhouse', W.CH, 360, { label: 'ClickHouse', sub: 'Cloud data warehouse', category: 'clickhouse', icon: 'clickhouse', badge: 'Native + Iceberg', hero: true }),
    cnode('superset', W.BI, 200, { label: 'Apache Superset', sub: 'BI dashboards', category: 'consume', icon: 'superset' }),
    cnode('bi', W.BI, 360, { label: 'BI Tools', sub: 'Tableau · Looker · Metabase', category: 'consume', icon: 'bi' }),
    cnode('sql', W.BI, 520, { label: 'SQL Clients', sub: 'Ad-hoc analytics', category: 'consume', icon: 'sql' }),
  ],
  edges: [
    edge('postgres', 'clickpipes'),
    edge('mysql', 'clickpipes'),
    edge('mongodb', 'clickpipes'),
    edge('clickpipes', 'clickhouse', { label: 'CDC' }, { targetHandle: 't' }),
    edge('saas', 'storage', { label: 'Files' }),
    edge('storage', 'clickhouse', { label: 'Iceberg / table functions' }),
    edge('clickhouse', 'superset'),
    edge('clickhouse', 'bi'),
    edge('clickhouse', 'sql'),
  ],
}

// 3) Observability
const O = { SRC: 150, COL: 470, STR: 790, CH: 1110, VIZ: 1430 }
export const vnObservability: DiagramDef = {
  id: 'vn-observability',
  title: 'Observability',
  description:
    'Fluent Bit, OpenTelemetry, and Vector collect logs/metrics/traces; Kafka buffers them into ClickHouse (ClickStack), with Vector and the native OTLP endpoint writing directly. Archived logs in object storage are pulled in by ClickPipes — all open-source and portable.',
  stages: [
    { title: 'Data Sources', x: O.SRC },
    { title: 'Collection', x: O.COL },
    { title: 'Streaming', x: O.STR },
    { title: 'Realtime Data Warehouse', x: O.CH },
    { title: 'Visualization & Alerting', x: O.VIZ },
  ],
  nodes: [
    cnode('apps', O.SRC, 180, { label: 'Applications', sub: 'Services & APIs', category: 'source', icon: 'apps' }),
    cnode('infra', O.SRC, 360, { label: 'Infrastructure / K8s', sub: 'Hosts & containers', category: 'source', icon: 'server' }),
    cnode('logs', O.SRC, 560, { label: 'Object Storage', sub: 'Archived logs', category: 'source', icon: 'objectstorage' }),
    cnode('fluentbit', O.COL, 170, { label: 'Fluent Bit', sub: 'Log forwarder', category: 'ingest', icon: 'fluentbit' }),
    cnode('otel', O.COL, 330, { label: 'OpenTelemetry', sub: 'Collector', category: 'ingest', icon: 'otel', badge: 'ClickStack', clickstack: true }),
    cnode('vector', O.COL, 520, { label: 'Vector', sub: 'Observability pipeline', category: 'ingest', icon: 'vector' }),
    cnode('kafka', O.STR, 330, { label: 'Apache Kafka', sub: 'Buffering & fan-out', category: 'ingest', icon: 'kafka' }),
    cnode('clickpipes', O.CH, 620, { label: 'ClickPipes', sub: 'Object storage ingestion', category: 'clickhouse', icon: 'clickpipes' }),
    cnode('clickhouse', O.CH, 360, { label: 'ClickHouse', sub: 'Logs · Metrics · Traces', category: 'clickhouse', icon: 'clickhouse', badge: 'ClickStack', hero: true, clickstack: true }),
    cnode('grafana', O.VIZ, 180, { label: 'Grafana', sub: 'Dashboards', category: 'consume', icon: 'grafana' }),
    cnode('hyperdx', O.VIZ, 330, { label: 'HyperDX', sub: 'Unified observability', category: 'consume', icon: 'hyperdx', badge: 'ClickStack', clickstack: true }),
    cnode('superset', O.VIZ, 480, { label: 'Apache Superset', sub: 'Exploration', category: 'consume', icon: 'superset' }),
    cnode('alerts', O.VIZ, 630, { label: 'Alerting', sub: 'On-call & incidents', category: 'consume', icon: 'alerts' }),
  ],
  edges: [
    edge('apps', 'fluentbit'),
    edge('apps', 'otel'),
    edge('infra', 'otel'),
    edge('infra', 'vector'),
    edge('fluentbit', 'kafka'),
    edge('otel', 'kafka'),
    edge('vector', 'clickhouse', { color: '#22C7BE', label: 'ClickHouse sink' }, { targetHandle: 't' }),
    edge('otel', 'clickhouse', { variant: 'optional', color: '#5B9BFF', label: 'Native OTLP' }, { targetHandle: 't' }),
    edge('kafka', 'clickhouse', { label: 'Kafka engine' }),
    edge('logs', 'clickpipes', { label: 'Object storage' }, { targetHandle: 'l' }),
    edge('clickpipes', 'clickhouse', {}, { sourceHandle: 'st', targetHandle: 'b' }),
    edge('clickhouse', 'grafana'),
    edge('clickhouse', 'hyperdx'),
    edge('clickhouse', 'superset'),
    edge('clickhouse', 'alerts'),
  ],
}

// 4) ML / Gen AI
const G = { APP: 160, FM: 490, TOOLS: 810, CH: 1130 }
export const vnGenai: DiagramDef = {
  id: 'vn-genai',
  title: 'Machine Learning / Gen AI',
  description:
    'A chat app drives an agent framework (LangChain / LlamaIndex) that reasons with open or hosted LLMs and calls tools via MCP — using ClickHouse for vector search and Langfuse (open source) for tracing. RAG is indexed with an open embedding model. Portable across any model provider or cloud.',
  stages: [
    { title: 'Applications & Data', x: G.APP },
    { title: 'Models & Agent', x: G.FM },
    { title: 'Tools', x: G.TOOLS },
    { title: 'Knowledge & Observability', x: G.CH },
  ],
  nodes: [
    cnode('chatapp', G.APP, 300, { label: 'Chat App', sub: 'LibreChat / custom UI', category: 'source', icon: 'apps' }),
    cnode('docs', G.APP, 600, { label: 'Documents', sub: 'Knowledge base', category: 'source', icon: 'docs' }),
    cnode('llm', G.FM, 170, { label: 'LLM', sub: 'Open or hosted models', category: 'agent', icon: 'llm' }),
    cnode('agent', G.FM, 360, { label: 'Agent Framework', sub: 'LangChain / LlamaIndex', category: 'agent', icon: 'robot' }),
    cnode('embed', G.FM, 600, { label: 'Embedding Model', sub: 'Open model', category: 'ingest', icon: 'llm' }),
    cnode('mcp', G.TOOLS, 250, { label: 'ClickHouse MCP', sub: 'Vector search tool', category: 'ingest', icon: 'clickhouse' }),
    cnode('tools', G.TOOLS, 430, { label: 'Tools / Functions', sub: 'Actions', category: 'ingest', icon: 'server' }),
    cnode('clickhouse', G.CH, 340, { label: 'ClickHouse', sub: 'Vector store + observability', category: 'clickhouse', icon: 'clickhouse', badge: 'Vector Search', hero: true }),
    cnode('langfuse', G.CH, 620, { label: 'Langfuse', sub: 'LLM & agent observability', category: 'consume', icon: 'langfuse', badge: 'Open source' }),
  ],
  edges: [
    edge('chatapp', 'agent', { label: 'Prompt' }),
    edge('agent', 'llm', { label: 'Reasoning' }, { sourceHandle: 'st', targetHandle: 'b' }),
    edge('agent', 'mcp', { label: 'Tool calls' }),
    edge('mcp', 'clickhouse', { label: 'Vector search' }),
    edge('agent', 'tools', { label: 'Actions' }),
    edge('docs', 'embed', { label: 'Documents' }),
    edge('embed', 'clickhouse', { label: 'Embeddings' }),
    edge('agent', 'langfuse', { color: '#34D399', label: 'Traces' }, { sourceHandle: 'sb', targetHandle: 'l' }),
  ],
}
