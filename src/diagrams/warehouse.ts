import { type DiagramDef, cnode, edge } from './types'

const SRC = 150
const ETL = 470
const LAKE = 790
const PIPES = 1075
const CH = 1300
const BI = 1620

// Data warehouse — explicit AWS-native services across SA-style stages.
export const warehouse: DiagramDef = {
  id: 'warehouse',
  title: 'Data Warehouse',
  description:
    'RDS & Aurora are captured directly by ClickPipes Postgres/MySQL CDC, SaaS data lands in an S3 Iceberg lake via AppFlow/Glue, and DynamoDB arrives via zero-ETL. ClickPipes ingests file-based loads and ClickHouse queries the Iceberg lake in place through the AWS Glue Data Catalog — serving BI and ad-hoc SQL.',
  stages: [
    { title: 'Data Sources', x: SRC },
    { title: 'Ingestion & ETL', x: ETL },
    { title: 'Data Lake', x: LAKE },
    { title: 'Realtime Data Warehouse', x: (PIPES + CH) / 2 },
    { title: 'BI & Analytics', x: BI },
  ],
  nodes: [
    // Data Sources
    cnode('rds', SRC, 160, { label: 'Amazon RDS', sub: 'Relational databases', category: 'source', icon: 'rds' }),
    cnode('aurora', SRC, 300, { label: 'Amazon Aurora', sub: 'Cloud-native OLTP', category: 'source', icon: 'aurora' }),
    cnode('dynamodb', SRC, 440, { label: 'Amazon DynamoDB', sub: 'NoSQL', category: 'source', icon: 'dynamodb' }),
    cnode('apps', SRC, 580, { label: 'SaaS & Apps', sub: 'External sources', category: 'source', icon: 'apps' }),

    // Ingestion & ETL  (RDS/Aurora are captured directly by ClickPipes CDC — no DMS)
    cnode('glue', ETL, 300, { label: 'AWS Glue', sub: 'Batch ETL', category: 'ingest', icon: 'glue' }),
    cnode('appflow', ETL, 470, { label: 'Amazon AppFlow', sub: 'SaaS connectors', category: 'ingest', icon: 'appflow' }),

    // Data Lake
    cnode('s3', LAKE, 280, { label: 'Amazon S3', sub: 'Iceberg data lake', category: 'ingest', icon: 's3' }),
    cnode('catalog', LAKE, 450, { label: 'AWS Glue Data Catalog', sub: 'Iceberg tables', category: 'ingest', icon: 'glue' }),

    // Realtime Data Warehouse
    cnode('clickpipes', PIPES, 365, { label: 'ClickPipes', sub: 'CDC + object storage', category: 'clickhouse', icon: 'clickpipes' }),
    cnode('clickhouse', CH, 350, { label: 'ClickHouse Cloud', sub: 'Cloud data warehouse', category: 'clickhouse', icon: 'clickhouse', badge: 'ClickPipes + Iceberg', hero: true }),

    // BI & Analytics
    cnode('quicksight', BI, 170, { label: 'Amazon QuickSight', sub: 'BI dashboards', category: 'consume', icon: 'quicksight' }),
    cnode('bi', BI, 320, { label: 'Tableau / Looker', sub: 'BI tools', category: 'consume', icon: 'bi' }),
    cnode('superset', BI, 470, { label: 'Apache Superset', sub: 'Exploration', category: 'consume', icon: 'superset' }),
    cnode('sql', BI, 620, { label: 'SQL Clients', sub: 'Ad-hoc analytics', category: 'consume', icon: 'sql' }),
  ],
  edges: [
    // RDS & Aurora (Postgres / MySQL) are captured directly by ClickPipes CDC — no DMS, no lake hop
    edge('rds', 'clickpipes', { label: 'Postgres / MySQL CDC' }, { targetHandle: 't' }),
    edge('aurora', 'clickpipes', { label: 'CDC' }, { targetHandle: 't' }),
    // SaaS / apps -> ETL
    edge('apps', 'appflow'),
    edge('apps', 'glue', { variant: 'optional' }),
    // DynamoDB zero-ETL: lands directly in S3 as Apache Iceberg — no pipeline / ETL job
    edge('dynamodb', 's3', { color: '#5BD6E3', label: 'Zero-ETL · Iceberg' }, { targetHandle: 'b' }),
    // Ingestion -> Data Lake
    edge('glue', 's3'),
    edge('appflow', 's3'),
    edge('s3', 'catalog', { label: 'Register' }),
    // ClickPipes ingests file-based loads; ClickHouse queries Iceberg in place via the Glue catalog
    edge('s3', 'clickpipes'),
    edge('clickpipes', 'clickhouse'),
    edge('catalog', 'clickhouse', { color: '#5BD6E3', label: 'DataLakeCatalog · Iceberg' }),
    // ClickHouse -> BI
    edge('clickhouse', 'quicksight'),
    edge('clickhouse', 'bi'),
    edge('clickhouse', 'superset'),
    edge('clickhouse', 'sql'),
  ],
}
