import { type DiagramDef, cnode, edge } from './types'

// Column centers
const SRC = 150
const COL = 470
const STR = 790
const PIPES = 1075
const CH = 1300
const VIZ = 1620
const SNS = 1860

// Observability — explicit AWS-native services across SA-style stages.
//  - Fluent Bit and OpenTelemetry ship to the streaming layer (Kinesis / MSK) for buffered,
//    decoupled ingestion via ClickPipes; OTel can also use the native OTLP endpoint.
//  - Vector writes DIRECTLY to ClickHouse via its native ClickHouse sink — no Kinesis/ClickPipes
//    hop (that would just duplicate Vector's own batching/delivery and add cost).
//  - CloudWatch streams to Data Firehose (subscription filter) -> ClickHouse HTTP endpoint.
//  - Many AWS services only emit logs to S3 (CloudTrail, VPC Flow Logs, ELB, WAF, ...); ClickPipes
//    pulls those from the S3 log archive.
export const observability: DiagramDef = {
  id: 'observability',
  title: 'Observability',
  description:
    'Fluent Bit and OpenTelemetry buffer through Kinesis / MSK into ClickPipes; Vector writes directly to ClickHouse via its native sink; CloudWatch streams via Data Firehose; and S3-only service logs (CloudTrail, VPC Flow, ELB, WAF) are pulled by ClickPipes. All land in ClickHouse (ClickStack) for Grafana / QuickSight / Superset / HyperDX and SNS alerting.',
  stages: [
    { title: 'Data Sources', x: SRC },
    { title: 'Collection & Routing', x: COL },
    { title: 'Streaming Processing', x: STR },
    { title: 'Realtime Data Warehouse', x: (PIPES + CH) / 2 },
    { title: 'Visualization & Alerting', x: (VIZ + SNS) / 2 },
  ],
  nodes: [
    // Data Sources
    cnode('apps', SRC, 110, { label: 'Applications', sub: 'Services & APIs', category: 'source', icon: 'apps' }),
    cnode('ec2', SRC, 240, { label: 'Amazon EC2', sub: 'Compute instances', category: 'source', icon: 'ec2' }),
    cnode('ecs', SRC, 370, { label: 'Amazon ECS / EKS', sub: 'Containers', category: 'source', icon: 'ecs' }),
    cnode('lambda', SRC, 500, { label: 'AWS Lambda', sub: 'Functions', category: 'source', icon: 'lambda' }),
    cnode('cloudwatch', SRC, 630, { label: 'Amazon CloudWatch', sub: 'Logs & metrics', category: 'source', icon: 'cloudwatch' }),
    cnode('awslogs', SRC, 770, { label: 'AWS Service Logs', sub: 'CloudTrail · VPC Flow · ELB', category: 'source', icon: 'cloudtrail' }),

    // Collection & Routing
    cnode('fluentbit', COL, 110, { label: 'Fluent Bit', sub: 'Log forwarder', category: 'ingest', icon: 'fluentbit' }),
    cnode('vector', COL, 250, { label: 'Vector', sub: 'Observability pipeline', category: 'ingest', icon: 'vector' }),
    cnode('otel', COL, 440, { label: 'OpenTelemetry', sub: 'Collector', category: 'ingest', icon: 'otel', badge: 'ClickStack', clickstack: true }),
    cnode('s3', COL, 770, { label: 'Amazon S3', sub: 'Log archive', category: 'ingest', icon: 's3' }),

    // Streaming Processing
    cnode('kinesis', STR, 240, { label: 'Amazon Kinesis', sub: 'Data Streams', category: 'ingest', icon: 'kinesis' }),
    cnode('msk', STR, 400, { label: 'Amazon MSK', sub: 'Managed Kafka', category: 'ingest', icon: 'msk' }),
    cnode('firehose', STR, 560, { label: 'Amazon Data Firehose', sub: 'Delivery streams', category: 'ingest', icon: 'firehose' }),

    // Realtime Data Warehouse
    cnode('clickpipes', PIPES, 410, { label: 'ClickPipes', sub: 'Managed ingestion', category: 'clickhouse', icon: 'clickpipes' }),
    cnode('clickhouse', CH, 395, { label: 'ClickHouse Cloud', sub: 'Logs · Metrics · Traces', category: 'clickhouse', icon: 'clickhouse', badge: 'ClickStack', hero: true, clickstack: true }),

    // Visualization & Alerting
    cnode('managedgrafana', VIZ, 190, { label: 'Amazon Managed Grafana', sub: 'Dashboards', category: 'consume', icon: 'managedgrafana' }),
    cnode('sns', SNS, 190, { label: 'Amazon SNS', sub: 'Notifications', category: 'consume', icon: 'sns' }),
    cnode('quicksight', VIZ, 340, { label: 'Amazon QuickSight', sub: 'BI dashboards', category: 'consume', icon: 'quicksight' }),
    cnode('superset', VIZ, 490, { label: 'Apache Superset', sub: 'Exploration', category: 'consume', icon: 'superset' }),
    cnode('hyperdx', VIZ, 640, { label: 'HyperDX', sub: 'Unified observability', category: 'consume', icon: 'hyperdx', badge: 'ClickStack', clickstack: true }),
  ],
  edges: [
    // Sources -> Collectors
    edge('apps', 'fluentbit'),
    edge('ec2', 'vector'),
    edge('ecs', 'otel'),
    edge('lambda', 'otel'),
    // AWS services that only log to S3 -> S3 archive -> ClickPipes
    edge('awslogs', 's3', { label: 'Logs' }),
    // Fluent Bit & OTel buffer through the streaming layer; Vector writes directly to ClickHouse
    edge('fluentbit', 'kinesis'),
    edge('otel', 'kinesis'),
    edge('otel', 'msk'),
    edge('vector', 'clickhouse', { color: '#22C7BE', label: 'ClickHouse sink' }, { targetHandle: 't' }),
    // CloudWatch streams directly to Firehose via a subscription filter (no collector needed)
    edge('cloudwatch', 'firehose', { label: 'Subscription filter' }),
    // ClickPipes ingests Kinesis, MSK, and the S3 log archive
    edge('kinesis', 'clickpipes'),
    edge('msk', 'clickpipes'),
    edge('s3', 'clickpipes', { label: 'Object storage' }, { targetHandle: 'b' }),
    edge('clickpipes', 'clickhouse'),
    // Firehose is NOT a ClickPipes source — delivers directly to ClickHouse (HTTP endpoint)
    edge('firehose', 'clickhouse', { label: 'HTTP endpoint' }, { targetHandle: 'b' }),
    // OTel native OTLP endpoint writes straight to ClickHouse
    edge('otel', 'clickhouse', { variant: 'optional', color: '#5B9BFF', label: 'Native OTel Endpoint' }, { targetHandle: 't' }),
    // ClickHouse -> Visualization
    edge('clickhouse', 'managedgrafana'),
    edge('clickhouse', 'quicksight'),
    edge('clickhouse', 'superset'),
    edge('clickhouse', 'hyperdx'),
    // Alerting
    edge('managedgrafana', 'sns', { variant: 'optional', color: '#FF7AB6', label: 'Alerting Rules' }),
  ],
}
