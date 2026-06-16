// Icon registry — SVGs are imported as RAW strings and rendered INLINE in the DOM (not via
// <img src>). This removes every external dependency: no asset URLs, no network fetch, no MIME
// type, no cache, no base-path concerns. Icons render identically on the dev server, in the built
// bundle, and even from dist/index.html opened via file://.
//
// Each icon's internal ids (e.g. gradient ids like "linearGradient-1", which many AWS icons reuse)
// are namespaced per key so that inlining many SVGs into one document doesn't cause id collisions.

import clickhouse from './clickhouse.svg?raw'

// AWS-native services
import apigateway from './aws/apigateway.svg?raw'
import appflow from './aws/appflow.svg?raw'
import aurora from './aws/aurora.svg?raw'
import bedrock from './aws/bedrock.svg?raw'
import cloudtrail from './aws/cloudtrail.svg?raw'
import cloudwatch from './aws/cloudwatch.svg?raw'
import datasync from './aws/datasync.svg?raw'
import dms from './aws/dms.svg?raw'
import dynamodb from './aws/dynamodb.svg?raw'
import ec2 from './aws/ec2.svg?raw'
import ecs from './aws/ecs.svg?raw'
import eks from './aws/eks.svg?raw'
import firehose from './aws/firehose.svg?raw'
import flink from './aws/flink.svg?raw'
import glue from './aws/glue.svg?raw'
import iotcore from './aws/iotcore.svg?raw'
import kinesis from './aws/kinesis.svg?raw'
import lambda from './aws/lambda.svg?raw'
import managedgrafana from './aws/managedgrafana.svg?raw'
import msk from './aws/msk.svg?raw'
import quicksight from './aws/quicksight.svg?raw'
import rds from './aws/rds.svg?raw'
import s3 from './aws/s3.svg?raw'
import sagemaker from './aws/sagemaker.svg?raw'
import sns from './aws/sns.svg?raw'

// Non-AWS / third-party marks
import fluentbit from './aws/fluentbit.svg?raw'
import grafana from './aws/grafana.svg?raw'
import hyperdx from './aws/hyperdx.svg?raw'
import langfuse from './aws/langfuse.svg?raw'
import librechat from './aws/librechat.svg?raw'
import otel from './aws/otel.svg?raw'
import superset from './aws/superset.svg?raw'
import vector from './aws/vector.svg?raw'

// Bedrock AgentCore platform (crafted, violet family)
import agentcore from './aws/agentcore.svg?raw'
import gateway from './aws/gateway.svg?raw'
import memory from './aws/memory.svg?raw'
import guardrails from './aws/guardrails.svg?raw'
import codeinterpreter from './aws/codeinterpreter.svg?raw'
import browser from './aws/browser.svg?raw'

// ClickHouse-specific + crafted generic glyphs
import alerts from './aws/alerts.svg?raw'
import apps from './aws/apps.svg?raw'
import bi from './aws/bi.svg?raw'
import sql from './aws/sql.svg?raw'
import user from './aws/user.svg?raw'

// Vendor-neutral / open-source tech
import kafka from './aws/kafka.svg?raw'
import postgres from './aws/postgres.svg?raw'
import mysql from './aws/mysql.svg?raw'
import mongodb from './aws/mongodb.svg?raw'
import flinkoss from './aws/flinkoss.svg?raw'
import objectstorage from './aws/objectstorage.svg?raw'
import cdc from './aws/cdc.svg?raw'
import llm from './aws/llm.svg?raw'
import server from './aws/server.svg?raw'

// Friendly glyphs for the non-technical "use cases" diagrams
import people from './aws/people.svg?raw'
import cart from './aws/cart.svg?raw'
import dashboard from './aws/dashboard.svg?raw'
import store from './aws/store.svg?raw'
import globe from './aws/globe.svg?raw'
import robot from './aws/robot.svg?raw'
import docs from './aws/docs.svg?raw'

const raw = {
  clickhouse,
  apigateway,
  appflow,
  aurora,
  bedrock,
  cloudtrail,
  cloudwatch,
  datasync,
  dms,
  dynamodb,
  ec2,
  ecs,
  eks,
  firehose,
  flink,
  glue,
  iotcore,
  kinesis,
  lambda,
  managedgrafana,
  msk,
  quicksight,
  rds,
  s3,
  sagemaker,
  sns,
  fluentbit,
  grafana,
  hyperdx,
  langfuse,
  librechat,
  otel,
  superset,
  vector,
  agentcore,
  gateway,
  memory,
  guardrails,
  codeinterpreter,
  browser,
  // ClickPipes is a ClickHouse-managed service — render it with the ClickHouse logo.
  clickpipes: clickhouse,
  alerts,
  apps,
  bi,
  sql,
  user,
  people,
  cart,
  dashboard,
  store,
  globe,
  robot,
  docs,
  kafka,
  postgres,
  mysql,
  mongodb,
  flinkoss,
  objectstorage,
  cdc,
  llm,
  server,
} as const

export type IconKey = keyof typeof raw

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Prepare an SVG string for safe inline rendering: drop the XML prolog, namespace internal ids,
// strip the root width/height, and make it scale to its container.
function prepare(svg: string, key: string): string {
  let out = svg.replace(/<\?xml[\s\S]*?\?>/, '').trim()

  const ids = [...new Set([...out.matchAll(/id="([^"]+)"/g)].map((m) => m[1]))].sort(
    (a, b) => b.length - a.length,
  )
  for (const id of ids) {
    const e = escapeRe(id)
    out = out.replace(new RegExp(`id="${e}"`, 'g'), `id="${id}__${key}"`)
    // catches url(#id), href="#id", xlink:href="#id" — but not longer ids sharing a prefix
    out = out.replace(new RegExp(`#${e}(?![\\w-])`, 'g'), `#${id}__${key}`)
  }

  out = out
    .replace(/(<svg[^>]*?)\swidth="[^"]*"/, '$1')
    .replace(/(<svg[^>]*?)\sheight="[^"]*"/, '$1')
    .replace(/<svg\b/, '<svg style="width:100%;height:100%;display:block"')

  return out
}

export const icons: Record<string, string> = Object.fromEntries(
  Object.entries(raw).map(([key, svg]) => [key, prepare(svg, key)]),
)

/** Returns the inline SVG markup for an icon key, or undefined if unknown. */
export function iconSvg(key?: string): string | undefined {
  if (!key) return undefined
  return icons[key]
}
