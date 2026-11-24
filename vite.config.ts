import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import pkg from './package.json' with { type: 'json' }
import { SERVICES } from './src/services'

// Production-only Content-Security-Policy. The page may talk only to itself (incidents.json) and to the
// services it checks, so adding a service in src/services.ts also lets the page reach it.
const origins = SERVICES.map((s) => new URL(s.url).origin).join(' ')
const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self'",
  `connect-src 'self' ${origins}`,
  "base-uri 'none'",
  "form-action 'none'"
].join('; ')

function csp(): Plugin {
  return {
    name: 'keston-status:csp',
    apply: 'build',
    transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }]
  }
}

const build = (process.env.APP_BUILD ?? process.env.GITHUB_SHA ?? '').slice(0, 7)

export default defineConfig({
  base: './',
  plugins: [vue(), tailwindcss(), csp()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version), __APP_BUILD__: JSON.stringify(build) },
  build: { assetsInlineLimit: 0, target: 'es2022' }
})
