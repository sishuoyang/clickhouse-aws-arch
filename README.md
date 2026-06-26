# DiagramHouse — ClickHouse Reference Architectures

Animated reference-architecture diagrams showing how AWS native / first-party services
integrate with ClickHouse across four use cases:

1. **Real-time Analytics** — API Gateway / IoT Core / apps → Kinesis · MSK **→ ClickPipes →** ClickHouse (materialized views), with **Amazon RDS → ClickPipes via Postgres/MySQL CDC**; Data Firehose (HTTP endpoint), Managed Flink (sink), and Lambda write **directly** to ClickHouse → QuickSight · Managed Grafana · Superset · APIs
2. **Data Warehouse** — **RDS · Aurora → ClickPipes via Postgres/MySQL CDC** (no DMS); SaaS → Glue · AppFlow → S3 Iceberg lake; **DynamoDB → S3 via zero-ETL (Apache Iceberg)**. ClickPipes ingests CDC + file loads while ClickHouse **queries the Iceberg lake in place via the AWS Glue Data Catalog (DataLakeCatalog)** → QuickSight · Tableau/Looker · Superset · SQL
3. **Observability** — Fluent Bit · OpenTelemetry buffer through Kinesis · MSK **→ ClickPipes →** ClickHouse (ClickStack), and S3-only service logs (CloudTrail · VPC Flow · ELB) are pulled by ClickPipes; **Vector writes directly to ClickHouse** (native sink), CloudWatch → Data Firehose (subscription filter → HTTP endpoint), and OTel's native OTLP endpoint also write **directly** → Managed Grafana (→ SNS) · QuickSight · Superset · HyperDX

> ClickPipes only ingests its [supported sources](https://clickhouse.com/docs/integrations/clickpipes) (Kafka/MSK, Kinesis, object storage like S3, and Postgres/MySQL/MongoDB CDC). Services that aren't ClickPipes sources — Data Firehose, Lambda, Managed Flink — connect directly to ClickHouse Cloud.

Each diagram is laid out as **SA-style stage columns** (Data Sources → Collection/Ingestion → Streaming/ETL → Realtime Data Warehouse → Visualization) with explicit Amazon service names and an explicit **ClickPipes** ingestion node.
4. **Machine Learning / Gen AI** — LibreChat runs its *own* agent framework, calling **Amazon Bedrock foundation models** (validated by **Bedrock Guardrails**) and using **MCP tools** — the **ClickHouse MCP server** for vector search/analytics, plus Lambda actions; RAG is indexed **event-driven (S3 event → Lambda → Bedrock embeddings → ClickHouse)**, and every message is traced to **Langfuse** (stored in ClickHouse). ClickHouse is the shared vector store, analytics tool, and observability backend

## Three views (dropdown in the sidebar)

A **View** dropdown switches the whole app between three sets of four diagrams:

- **Use Cases** — plain-language, non-technical illustrations of the same four scenarios using
  everyday examples (an online store's live dashboard, a retail chain's combined data, keeping a
  website healthy, an AI assistant answering from company knowledge). No jargon — for explaining
  *what* ClickHouse does to non-technical audiences. (`uc-*` GIFs.)
- **Architecture Diagrams (AWS)** — the technical AWS reference architectures above (for SAs/engineers).
- **Architecture (Vendor-Neutral)** — the same four architectures built from portable, open-source /
  multi-cloud components instead of AWS services: **Apache Kafka** (vs MSK/Kinesis), **PostgreSQL /
  MySQL / MongoDB**, **object storage** + **Iceberg**, **CDC** (Debezium/PeerDB), **OpenTelemetry /
  Fluent Bit / Vector**, **Grafana / Superset / HyperDX**, **open LLMs** + **LangChain/LlamaIndex** +
  **ClickHouse MCP**, and **Langfuse**. ClickHouse is the constant. (`vn-*` GIFs.)

Built with **React + Vite + [React Flow](https://reactflow.dev) (`@xyflow/react`)**. Data flows
are shown as glowing particles pulsing along the edges, driven by a single deterministic clock so
they can be exported as perfectly looping GIFs.

## Develop

```bash
npm install
npm run dev          # http://localhost:5173 — sidebar to switch diagrams, play/pause/speed controls
```

**Demo mode:** the sidebar's **▶ Auto-play use cases** button cycles through the four diagrams one
by one (≈8s each, looping) — great for an ambient demo. Hit **⏸ Pause auto-play** to stop on the
current use case so you can talk through it. (This is separate from the top-bar Play/Pause, which
controls the particle animation.)

## Fine-tune layouts by dragging

In the running app you can fine-tune each diagram interactively:

- **Drag any node** to reposition it.
- **Drag either end of an edge** — hover an edge and two grab dots appear, one at the originating
  (tail) end and one at the arrow (head) end. Drag either onto **any side of any box** to change
  where the arrow attaches. Handles appear on every side of a node on hover. Useful for making
  arrows route cleanly.
- **Show / hide group labels** — the **⊟ Hide group labels** toggle (top-right) shows or hides the
  stage headers (e.g. "Applications & Data", "Foundation Models"). The toggle itself never appears
  in a GIF, and when labels are hidden they're excluded from the GIF too.

Dragging, reconnecting, and toggling labels change the view **live** — nothing is persisted until
you click **💾 Save layout** (top-right). Saving writes the current arrangement (node positions,
edge connection points, and label visibility) to `layouts/<id>.json`, which becomes the **default
that loads on startup** and that the **GIF renderer uses**. **⤺ Reset layout** clears the saved
default and reverts to the built-in layout. So the workflow is: **drag/reconnect to taste → Save
layout → reload or render**.

## Export GIFs (for PowerPoint)

```bash
npm install
npx playwright install chromium   # one-time: install the headless browser

# Recommended: with `npm run dev` running, render the LIVE instance (reflects your dragged layout)
npm run render                    # renders all diagrams -> out/*.gif
npm run render -- ml-genai        # render a single diagram by id
```

Or use the **`./render.sh`** wrapper to pick what to render — all, specific ids, or interactively:

```bash
./render.sh                       # interactive menu — pick by number(s), id(s), or "all"
./render.sh all                   # render every diagram
./render.sh observability         # a single diagram by id
./render.sh real-time vn-genai    # several at once
./render.sh --list                # list the available diagram ids
```

The renderer **attaches to an already-running server** (`npm run dev` on :5173, or preview on
:4173) so it captures exactly what you see — including any dragged layout. If no server is running,
it falls back to building and starting a preview server automatically. Override the target with
`RENDER_URL=http://localhost:5173 npm run render`.

Each GIF is a smooth infinite loop, **cropped to the diagram's content** (black margins removed) and
**inter-frame compressed** — only the moving particles are re-encoded per frame, so files are ~1 MB
instead of ~5 MB. Drag the file from `out/` straight onto a PowerPoint slide — it animates on loop
automatically.

Tune size / frame rate / loop length in [`scripts/render.config.mjs`](scripts/render.config.mjs).

## Deploy as a static website (AWS S3)

The app is a fully static bundle (Vite, `base: './'`), so it can be hosted anywhere. Two scripts
cover build + deploy:

```bash
./build-static.sh                         # -> dist/  (npm run build:static)
BUCKET=my-clickhouse-diagrams ./deploy-aws.sh   # upload to S3 website hosting (npm run deploy)
```

- **`build-static.sh`** runs the Vite build and additionally writes each saved `layouts/<id>.json`
  to `dist/__layout/<id>`. In dev/preview those layouts are served by a Vite middleware; a static
  host has no middleware, so materializing them means the deployed site renders the *same*
  fine-tuned layouts as the GIFs. Diagrams without a saved layout fall back to the built-in
  defaults automatically.
- **`deploy-aws.sh`** (needs the AWS CLI configured) creates the bucket if missing, enables public
  read, turns on S3 static website hosting, and `aws s3 sync`s `dist/` with good cache headers
  (content-hashed assets are immutable + long-cached; `index.html` and the layout JSON are
  `no-cache`). It prints the website endpoint when done.
  - Env: `BUCKET` (required), `REGION` (default `us-east-1`), `AWS_PROFILE` (optional),
    `CLOUDFRONT_DISTRIBUTION_ID` (optional — invalidates the CDN after each upload).
  - S3 website endpoints are HTTP-only; put **CloudFront** in front for HTTPS and a custom domain.

## How the animation stays GIF-able

Particle positions are a pure function of a looping `progress` value (`src/animation/clock.ts`).
In the browser it advances via `requestAnimationFrame`; during rendering, `?capture=1` pauses the
clock and the render script steps it frame-by-frame through `window.__setFrame(t)`, capturing a
screenshot per frame. Same code path powers both interactive playback and deterministic export.

## Editing the diagrams

Each diagram is a declarative `DiagramDef` in `src/diagrams/` (`realtime.ts`, `warehouse.ts`,
`observability.ts`, `mlgenai.ts`). Define `stages` (column headers, by center x), place nodes with
`cnode(id, columnCenterX, y, data)`, and connect them with
`edge(source, target, { variant, label, color }, { sourceHandle, targetHandle })`. Edges default to
leaving the right handle and entering the left; use `targetHandle: 't' | 'b'` (and `sourceHandle:
'st' | 'sb'`) to route over/under other nodes. Register new diagrams in `src/diagrams/index.ts` —
the sidebar and the GIF renderer pick them up automatically.

Service icons live in `src/icons/` and are imported as **raw SVG and rendered inline** in the DOM
(not via `<img src>`) through the registry in `src/icons/index.ts`. Inlining removes every external
dependency — no asset URLs, fetches, MIME types, caches, or base-path issues — so icons render
identically on the dev server and in the built bundle. Internal gradient ids are namespaced per icon
so inlined SVGs don't collide. Reference an icon by its registry **key** (e.g. `icon: 'msk'`), not a
path — a missing/renamed file becomes a build error. To add an icon, drop the SVG in `src/icons/aws/`
and add one line to the registry. The set includes official AWS Architecture Icons plus ClickHouse /
Grafana / OpenTelemetry / Superset / Fluent Bit marks and crafted glyphs (ClickPipes, Vector,
Langfuse, LibreChat, Bedrock).

> Run the app via `npm run dev` or `npm run preview` (a local server). Opening `dist/index.html`
> directly through `file://` won't work — browsers block ES-module bundles over `file://`.
