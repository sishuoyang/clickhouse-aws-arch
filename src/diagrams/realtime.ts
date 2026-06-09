import { type DiagramDef, cnode, edge } from './types'

const SRC = 150
const ING = 470
const PROC = 790
const PIPES = 1075
const CH = 1300
const VIZ = 1620

// Real-time analytics — explicit AWS-native services across SA-style stages.
export const realtime: DiagramDef = {
  id: 'real-time',
  title: 'Real-time Analytics',
  description:
    'High-volume events stream through Kinesis / MSK / Data Firehose (optionally processed by Managed Flink or Lambda) into ClickHouse via ClickPipes, where incremental materialized views power live dashboards and APIs.',
  stages: [
    { title: 'Data Sources', x: SRC },
    { title: 'Stream Ingestion', x: ING },
    { title: 'Stream Processing', x: PROC },
    { title: 'Realtime Data Warehouse', x: (PIPES + CH) / 2 },
    { title: 'Visualization & APIs', x: VIZ },
  ],
  nodes: [
    // Data Sources
    cnode('apps', SRC, 160, { label: 'Web & Mobile Apps', sub: 'Clickstream / events', category: 'source', icon: 'apps' }),
    cnode('apigateway', SRC, 300, { label: 'Amazon API Gateway', sub: 'Event APIs', category: 'source', icon: 'apigateway' }),
    cnode('iotcore', SRC, 440, { label: 'AWS IoT Core', sub: 'Device telemetry', category: 'source', icon: 'iotcore' }),
    cnode('ec2', SRC, 580, { label: 'Amazon EC2 / ECS', sub: 'Application services', category: 'source', icon: 'ec2' }),
    cnode('rds', SRC, 720, { label: 'Amazon RDS', sub: 'Postgres / MySQL', category: 'source', icon: 'rds' }),

    // Stream Ingestion
    cnode('kinesis', ING, 230, { label: 'Amazon Kinesis', sub: 'Data Streams', category: 'ingest', icon: 'kinesis' }),
    cnode('msk', ING, 380, { label: 'Amazon MSK', sub: 'Managed Kafka', category: 'ingest', icon: 'msk' }),
    cnode('firehose', ING, 530, { label: 'Amazon Data Firehose', sub: 'Delivery streams', category: 'ingest', icon: 'firehose' }),

    // Stream Processing (optional)
    cnode('flink', PROC, 250, { label: 'Managed Apache Flink', sub: 'In-stream processing', category: 'ingest', icon: 'flink' }),
    cnode('lambda', PROC, 470, { label: 'AWS Lambda', sub: 'Lightweight transforms', category: 'ingest', icon: 'lambda' }),

    // Realtime Data Warehouse
    cnode('clickpipes', PIPES, 380, { label: 'ClickPipes', sub: 'Managed ingestion', category: 'clickhouse', icon: 'clickpipes' }),
    cnode('clickhouse', CH, 365, { label: 'ClickHouse Cloud', sub: 'Real-time analytics', category: 'clickhouse', icon: 'clickhouse', badge: 'Materialized Views', hero: true }),

    // Visualization & APIs
    cnode('quicksight', VIZ, 170, { label: 'Amazon QuickSight', sub: 'Live dashboards', category: 'consume', icon: 'quicksight' }),
    cnode('managedgrafana', VIZ, 320, { label: 'Amazon Managed Grafana', sub: 'Real-time monitoring', category: 'consume', icon: 'managedgrafana' }),
    cnode('superset', VIZ, 470, { label: 'Apache Superset', sub: 'Exploration', category: 'consume', icon: 'superset' }),
    cnode('apis', VIZ, 620, { label: 'Application APIs', sub: 'Customer-facing analytics', category: 'consume', icon: 'apps' }),
  ],
  edges: [
    // Sources -> Ingestion
    edge('apps', 'kinesis'),
    edge('apigateway', 'kinesis'),
    edge('apigateway', 'firehose'),
    edge('iotcore', 'kinesis'),
    edge('ec2', 'msk'),
    // Kinesis & MSK are ClickPipes sources -> ClickPipes -> ClickHouse
    edge('kinesis', 'clickpipes'),
    edge('msk', 'clickpipes'),
    edge('clickpipes', 'clickhouse'),
    // RDS (Postgres / MySQL) is a ClickPipes CDC source -> ClickPipes (direct, no streaming layer)
    edge('rds', 'clickpipes', { label: 'Postgres / MySQL CDC' }, { targetHandle: 'b' }),
    // Data Firehose is NOT a ClickPipes source — it delivers directly to ClickHouse (HTTP endpoint)
    edge('firehose', 'clickhouse', { label: 'HTTP endpoint' }, { targetHandle: 'b' }),
    // Optional stream processing — Flink/Lambda are NOT ClickPipes sources, they write directly
    edge('kinesis', 'flink', { variant: 'optional' }),
    edge('flink', 'clickhouse', { variant: 'optional', label: 'ClickHouse sink' }, { targetHandle: 't' }),
    edge('kinesis', 'lambda', { variant: 'optional' }),
    edge('lambda', 'clickhouse', { variant: 'optional', label: 'Direct insert' }, { targetHandle: 'b' }),
    // ClickHouse -> Visualization & APIs
    edge('clickhouse', 'quicksight'),
    edge('clickhouse', 'managedgrafana'),
    edge('clickhouse', 'superset'),
    edge('clickhouse', 'apis'),
  ],
}
