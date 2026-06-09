// Render each reference-architecture diagram to a looping animated GIF.
//
// By default this attaches to an ALREADY-RUNNING server (your `npm run dev` instance), so you can
// drag nodes to fine-tune a layout in the browser and then render a GIF that reflects it — no
// rebuild. If no server is reachable it falls back to building and starting a preview server.
//
// Pipeline:
//   1. find a running server (dev :5173 or preview :4173), or build + preview as a fallback
//   2. Playwright opens each diagram in capture mode (?capture=1) at a fixed viewport
//   3. window.__setFrame(t) drives the deterministic animation clock frame-by-frame
//   4. each frame is screenshotted, decoded, quantized, and written to a GIF (gifenc)
//
// Usage:
//   npm run dev                 # in one terminal — fine-tune layouts by dragging
//   npm run render              # in another — renders the running instance to out/*.gif
//   npm run render -- ml-genai  # a single diagram by id
//   RENDER_URL=http://localhost:5173 npm run render   # explicit server

import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { chromium } from 'playwright'
import gifenc from 'gifenc'
import { PNG } from 'pngjs'
import { settingsFor } from './render.config.mjs'

const { GIFEncoder, quantize, applyPalette } = gifenc

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDir = join(root, 'out')

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd: root, stdio: 'inherit', shell: false, ...opts })
    p.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`)),
    )
  })
}

async function reachable(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) })
    return res.ok
  } catch {
    return false
  }
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (await reachable(url)) return
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error(`Server at ${url} did not start in time`)
}

// Prefer an already-running server; otherwise build + start a preview server.
async function resolveServer() {
  const candidates = [process.env.RENDER_URL, 'http://localhost:5173', 'http://localhost:4173']
    .filter(Boolean)
  for (const base of candidates) {
    if (await reachable(base)) {
      console.log(`› Using running server at ${base}`)
      return { base, cleanup: async () => {} }
    }
  }

  console.log('› No running server found — building and starting a preview server…')
  await run('npx', ['vite', 'build'])
  const server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    cwd: root,
    stdio: 'ignore',
    shell: false,
  })
  const base = 'http://localhost:4173'
  await waitForServer(base)
  return { base, cleanup: async () => server.kill() }
}

// Bounding box (CSS px) of the diagram content, so we crop the black margins away.
async function contentClip(page, pad = 24) {
  return page.evaluate((p) => {
    const els = document.querySelectorAll(
      '.react-flow__node, .react-flow__edge, .react-flow__edgelabel-renderer > *',
    )
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    for (const el of els) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue
      minX = Math.min(minX, r.left)
      minY = Math.min(minY, r.top)
      maxX = Math.max(maxX, r.right)
      maxY = Math.max(maxY, r.bottom)
    }
    minX = Math.max(0, Math.floor(minX - p))
    minY = Math.max(0, Math.floor(minY - p))
    maxX = Math.min(window.innerWidth, Math.ceil(maxX + p))
    maxY = Math.min(window.innerHeight, Math.ceil(maxY + p))
    // even dimensions keep some players happy
    let w = maxX - minX
    let h = maxY - minY
    w -= w % 2
    h -= h % 2
    return { x: minX, y: minY, width: w, height: h }
  }, pad)
}

async function captureDiagram(page, base, id, settings) {
  const { fps, frames } = settings
  await page.goto(`${base}/?capture=1&diagram=${id}`, { waitUntil: 'networkidle' })

  await page.waitForFunction(() => window.__captureReady === true)
  await page.waitForSelector('.react-flow__edge path', { state: 'attached' })
  // Let fitView + fonts + first getTotalLength settle (and the saved layout apply).
  await page.waitForTimeout(600)

  const clip = await contentClip(page)

  const gif = GIFEncoder()
  const delay = Math.round(1000 / fps)
  let palette = null
  let transparentIndex = 0
  let prev = null // previous frame's full palette indices (the displayed colors)
  let W = clip.width
  let H = clip.height

  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.__setFrame(t), i / frames)
    const buf = await page.screenshot({ type: 'png', clip })
    const png = PNG.sync.read(buf)
    const rgba = new Uint8Array(png.data.buffer, png.data.byteOffset, png.data.length)
    W = png.width
    H = png.height

    if (i === 0) {
      // Quantize to <=255 colors and reserve one slot (magenta — absent from the diagram)
      // as the transparency index used for unchanged pixels in later frames.
      palette = quantize(rgba, 255, { format: 'rgba4444' })
      transparentIndex = palette.length
      palette.push(palette[0]?.length === 4 ? [255, 0, 255, 255] : [255, 0, 255])
      prev = applyPalette(rgba, palette, 'rgba4444')
      gif.writeFrame(prev, W, H, { palette, first: true, delay, dispose: 1 })
    } else {
      // Inter-frame diff: only pixels that changed are kept; the rest are transparent so the
      // previous frame shows through (disposal method 1). The diagram is static except for the
      // moving particles, so the vast majority of pixels are transparent → tiny frames.
      const full = applyPalette(rgba, palette, 'rgba4444')
      const out = new Uint8Array(full.length)
      for (let p = 0; p < full.length; p++) {
        out[p] = full[p] === prev[p] ? transparentIndex : full[p]
      }
      gif.writeFrame(out, W, H, {
        delay,
        transparent: true,
        transparentIndex,
        dispose: 1,
      })
      prev = full
    }
    process.stdout.write(`\r  ${id}: frame ${i + 1}/${frames}`)
  }
  process.stdout.write('\n')

  gif.finish()
  const bytes = gif.bytes()
  const file = join(outDir, `${id}.gif`)
  await writeFile(file, bytes)
  return { file, size: bytes.length, width: W, height: H, frames }
}

async function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith('-'))
  const { base, cleanup } = await resolveServer()

  try {
    await mkdir(outDir, { recursive: true })

    const browser = await chromium.launch()
    const s0 = settingsFor('real-time')
    const page = await browser.newPage({
      viewport: { width: s0.width, height: s0.height },
      deviceScaleFactor: 1,
    })

    // Discover the diagram list from the app itself (single source of truth).
    await page.goto(`${base}/?capture=1`, { waitUntil: 'networkidle' })
    const all = await page.evaluate(() => window.__diagrams ?? [])
    let list = all.map((d) => d.id)
    if (only.length) list = list.filter((id) => only.includes(id))
    if (!list.length) {
      throw new Error(`No matching diagrams. Available: ${all.map((d) => d.id).join(', ')}`)
    }

    console.log(`› Rendering ${list.length} diagram(s): ${list.join(', ')}\n`)
    const results = []
    for (const id of list) {
      results.push(await captureDiagram(page, base, id, settingsFor(id)))
    }

    await browser.close()

    console.log('\n✓ Done. GIFs written to out/:')
    for (const r of results) {
      console.log(
        `  ${r.file.replace(root + '/', '')}  ${r.width}×${r.height}  ${r.frames}f  ${(r.size / 1024 / 1024).toFixed(2)} MB`,
      )
    }
  } finally {
    await cleanup()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
