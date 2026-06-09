import { type DiagramDef, cnode, edge } from './types'

const APP = 160
const FM = 480
const TOOLS = 800
const CH = 1140

// ML / Gen AI — LibreChat runs its OWN agent framework: it calls Amazon Bedrock foundation models
// directly (Bedrock Converse API, validated by Bedrock Guardrails) and uses MCP tools — e.g. the
// ClickHouse MCP server for vector search / live analytics. Every message is traced to Langfuse
// (stored in ClickHouse).
//
// RAG indexing is event-driven: an S3 event triggers a Lambda that chunks the document, calls
// Bedrock embeddings, and writes the vectors to ClickHouse (Bedrock won't auto-source from S3,
// and ClickHouse isn't a Bedrock Knowledge Base target — so you orchestrate it).
export const mlgenai: DiagramDef = {
  id: 'ml-genai',
  title: 'Machine Learning / Gen AI',
  description:
    "LibreChat runs its own agent framework: it calls Amazon Bedrock foundation models (guarded by Bedrock Guardrails) and uses MCP tools including the ClickHouse MCP server, with tracing to Langfuse. RAG is indexed event-driven (S3 event → Lambda → Bedrock embeddings → ClickHouse). ClickHouse is the shared vector store, analytics tool, and observability backend.",
  stages: [
    { title: 'Applications & Data', x: APP },
    { title: 'Foundation Models', x: FM },
    { title: 'Agent Tools', x: TOOLS },
    { title: 'Knowledge & Observability', x: CH },
  ],
  nodes: [
    // Applications & Data
    cnode('librechat', APP, 300, { label: 'LibreChat', sub: 'Chat app + agent framework', category: 'source', icon: 'librechat' }),
    cnode('s3', APP, 600, { label: 'Amazon S3', sub: 'Document corpus', category: 'source', icon: 's3' }),

    // Foundation Models
    cnode('bedrockfm', FM, 160, { label: 'Amazon Bedrock', sub: 'Foundation models', category: 'agent', icon: 'bedrock' }),
    cnode('guardrails', FM, 310, { label: 'Bedrock Guardrails', sub: 'Safety & policy', category: 'agent', icon: 'guardrails' }),
    cnode('ingest', FM, 600, { label: 'AWS Lambda', sub: 'Embedding pipeline', category: 'ingest', icon: 'lambda' }),

    // Agent Tools
    cnode('chmcp', TOOLS, 160, { label: 'ClickHouse MCP', sub: 'Agent tool', category: 'ingest', icon: 'clickhouse' }),
    cnode('lambda', TOOLS, 310, { label: 'AWS Lambda', sub: 'Actions / tools', category: 'ingest', icon: 'lambda' }),
    cnode('embed', TOOLS, 600, { label: 'Amazon Bedrock', sub: 'Embeddings model', category: 'ingest', icon: 'bedrock' }),

    // Knowledge & Observability
    cnode('clickhouse', CH, 340, { label: 'ClickHouse Cloud', sub: 'Vector store + observability', category: 'clickhouse', icon: 'clickhouse', badge: 'Vector Search', hero: true }),
    cnode('langfuse', CH, 630, { label: 'Langfuse', sub: 'LLM & agent observability', category: 'consume', icon: 'langfuse', badge: 'Powered by ClickHouse' }),
  ],
  edges: [
    // Native LibreChat path: its agent framework calls Bedrock FMs (guarded) + MCP tools
    edge('librechat', 'bedrockfm', { label: 'Foundation models' }),
    edge('bedrockfm', 'guardrails', { label: 'Guardrails' }, { sourceHandle: 'sb', targetHandle: 't' }),
    edge('librechat', 'chmcp', { label: 'MCP tool' }),
    edge('librechat', 'lambda', { label: 'Actions' }),
    edge('chmcp', 'clickhouse', { label: 'Vector search · analytics' }),

    // Event-driven RAG indexing: S3 event -> Lambda -> Bedrock embeddings -> ClickHouse
    edge('s3', 'ingest', { label: 'S3 event' }),
    edge('ingest', 'embed', { label: 'Chunk + embed' }),
    edge('embed', 'clickhouse', { label: 'Vectors' }),

    // Observability — LibreChat traces every message to Langfuse (stored in ClickHouse)
    edge('librechat', 'langfuse', { color: '#34D399', label: 'Traces' }, { sourceHandle: 'sb', targetHandle: 'l' }),
    edge('langfuse', 'clickhouse', { color: '#34D399', label: 'Traces · Observations · Scores' }, { sourceHandle: 'st', targetHandle: 'b' }),
  ],
}
