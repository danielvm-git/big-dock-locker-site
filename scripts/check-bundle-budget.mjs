#!/usr/bin/env node
// story: BUG-007
// check-bundle-budget.mjs — fail when the critical-path asset payload regresses.
//
// "Critical path" is not "everything in dist": it is the set of files the
// browser must fetch before the page can render, i.e. the module script and the
// modulepreload links that vite writes into dist/index.html. A chunk reachable
// only through a dynamic import() is deliberately excluded — that is how a
// deferred SDK stays off the critical path.
//
// Budgets are gzip sizes, because that is what crosses the wire.
import { readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

/** Critical-path JavaScript ceiling, gzip. VISION: "minimal bundle size". */
export const JS_BUDGET_KB = 60
/** Critical-path CSS ceiling, gzip. */
export const CSS_BUDGET_KB = 10

const SCRIPT_RE = /<script\b[^>]*\ssrc="([^"]+)"/g
const PRELOAD_RE = /<link\b[^>]*\srel="modulepreload"[^>]*\shref="([^"]+)"/g
// Stylesheets are render-blocking, so they are on the critical path too.
const STYLESHEET_RE = /<link\b[^>]*\srel="stylesheet"[^>]*\shref="([^"]+)"/g

/**
 * Asset URLs from index.html that the browser fetches before first paint:
 * the module entry, its modulepreload links (static imports such as the Vue
 * vendor chunk) and the render-blocking stylesheets. Chunks reachable only
 * through a dynamic import() are intentionally absent.
 */
export function initialAssetUrls(html) {
  const urls = new Set()
  for (const match of html.matchAll(SCRIPT_RE)) urls.add(match[1])
  for (const match of html.matchAll(PRELOAD_RE)) urls.add(match[1])
  for (const match of html.matchAll(STYLESHEET_RE)) urls.add(match[1])
  return [...urls]
}

/** Gzip size of a file in KB. */
export function gzipKb(path) {
  return gzipSync(readFileSync(path)).length / 1024
}

const asDistPath = (distDir, url) => join(distDir, url.replace(/^\//, ''))

function main() {
  const distDir = resolve(process.argv[2] ?? 'dist')
  const indexPath = join(distDir, 'index.html')

  let html
  try {
    html = readFileSync(indexPath, 'utf-8')
  } catch {
    console.error(`check-bundle-budget: ${indexPath} not found — run "npm run build" first`)
    process.exit(2)
  }

  const urls = initialAssetUrls(html)
  if (urls.length === 0) {
    console.error(
      'check-bundle-budget: no script or modulepreload tags in index.html — refusing to pass',
    )
    process.exit(2)
  }

  const rows = []
  let failures = 0
  let jsTotal = 0
  let cssTotal = 0

  for (const url of urls) {
    const file = asDistPath(distDir, url)
    let raw
    try {
      raw = statSync(file).size
    } catch {
      console.error(`FAIL  ${url} — referenced by index.html but missing from ${distDir}`)
      failures += 1
      continue
    }
    const kb = gzipKb(file)
    const isJs = url.endsWith('.js') || url.endsWith('.mjs')
    if (isJs) jsTotal += kb
    if (url.endsWith('.css')) cssTotal += kb
    rows.push({ url, raw, kb, isJs })
  }

  const pad = (value, width) => String(value).padStart(width)
  console.log('critical path (gzip):')
  for (const row of rows) {
    console.log(`  ${pad(row.kb.toFixed(2), 7)} KB  ${pad(row.raw, 9)} B raw  ${row.url}`)
  }

  const jsBudgetLeft = JS_BUDGET_KB - jsTotal
  console.log(
    `\n  JS  ${jsTotal.toFixed(2)} KB / ${JS_BUDGET_KB} KB budget` +
      ` (${jsBudgetLeft >= 0 ? `${jsBudgetLeft.toFixed(2)} KB left` : `${(-jsBudgetLeft).toFixed(2)} KB over`})`,
  )
  console.log(`  CSS ${cssTotal.toFixed(2)} KB / ${CSS_BUDGET_KB} KB budget`)

  if (jsTotal > JS_BUDGET_KB) {
    console.error(
      `\nFAIL  critical-path JS is ${jsTotal.toFixed(2)} KB gzip, budget is ${JS_BUDGET_KB} KB`,
    )
    console.error(
      '      Move code behind a dynamic import() or shrink the payload; do not raise the budget',
    )
    console.error('      without recording the reason in specs/bugs/BUG-007-*.md.')
    failures += 1
  }
  if (cssTotal > CSS_BUDGET_KB) {
    console.error(
      `\nFAIL  critical-path CSS is ${cssTotal.toFixed(2)} KB gzip, budget is ${CSS_BUDGET_KB} KB`,
    )
    failures += 1
  }

  if (failures > 0) process.exit(1)
  console.log('\ncheck-bundle-budget: OK')
}

// Only run when invoked directly (the test imports the helpers above).
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main()
}
