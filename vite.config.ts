import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
} from 'node:fs'
import { resolve } from 'node:path'

// Persists per-diagram node positions to layouts/<id>.json so dragged layouts survive reloads
// AND are visible to the headless render browser (which hits the same running server).
function layoutPersistence(): PluginOption {
  const dir = resolve(process.cwd(), 'layouts')
  const fileFor = (id: string) => resolve(dir, `${id}.json`)
  const idFrom = (url = '') => url.match(/^\/__layout\/([\w-]+)/)?.[1]

  // typed loosely — this is dev-server glue, not app code
  const handler = (req: any, res: any, next: () => void) => {
    const id = idFrom(req.url)
    if (!id) return next()

    if (req.method === 'GET') {
      let body = '{}'
      try {
        body = readFileSync(fileFor(id), 'utf8')
      } catch {
        /* none saved yet */
      }
      res.setHeader('content-type', 'application/json')
      res.end(body)
      return
    }
    if (req.method === 'POST') {
      let body = ''
      req.on('data', (c: unknown) => (body += c))
      req.on('end', () => {
        try {
          mkdirSync(dir, { recursive: true })
          writeFileSync(fileFor(id), body || '{}')
          res.statusCode = 204
        } catch {
          res.statusCode = 500
        }
        res.end()
      })
      return
    }
    if (req.method === 'DELETE') {
      try {
        rmSync(fileFor(id))
      } catch {
        /* already gone */
      }
      res.statusCode = 204
      res.end()
      return
    }
    next()
  }

  return {
    name: 'layout-persistence',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

// Serves the rendered GIFs at /gifs/<id>.gif from the out/ directory during dev & preview, so the
// in-app "Download GIF" button works locally too (on a static host the GIFs are bundled into dist/).
function gifAssets(): PluginOption {
  const dir = resolve(process.cwd(), 'out')
  const handler = (req: any, res: any, next: () => void) => {
    const id = (req.url ?? '').match(/^\/gifs\/([\w-]+)\.gif/)?.[1]
    if (!id) return next()
    try {
      const buf = readFileSync(resolve(dir, `${id}.gif`))
      res.setHeader('content-type', 'image/gif')
      res.end(buf)
    } catch {
      res.statusCode = 404
      res.end()
    }
  }
  return {
    name: 'gif-assets',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the built app works from any path — a web server, a subpath,
  // or even dist/index.html opened directly via file://.
  base: './',
  plugins: [react(), layoutPersistence(), gifAssets()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
})
