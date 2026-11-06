// story: BUG-003
// e03s02 is titled "Playwright E2E **and CI Preflight Wiring**" and is marked
// done, but `preflight` never ran the E2E suite and no workflow referenced it.
// The 4 Playwright tests only ever ran on a developer machine, so a broken
// browser flow could land on main without any gate turning red.
//
// This guards the invariant: every gate that exists in package.json must be
// exercised by CI.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8')) as {
  scripts: Record<string, string>
}
const CI = readFileSync(resolve(ROOT, '.github/workflows/ci.yml'), 'utf-8')

const runsScript = (workflow: string, script: string) =>
  new RegExp(`npm run ${script.replace(/[:]/g, ':')}(\\s|$)`).test(workflow)

describe('CI covers every gate defined in package.json', () => {
  it('defines the expected gate scripts', () => {
    expect(Object.keys(pkg.scripts)).toEqual(
      expect.arrayContaining(['typecheck', 'test', 'test:e2e', 'lint', 'build', 'preflight']),
    )
  })

  it('preflight still aggregates typecheck, test, lint and build', () => {
    const preflight = pkg.scripts.preflight

    for (const gate of ['typecheck', 'test', 'lint', 'build']) {
      expect(preflight).toContain(`npm run ${gate}`)
    }
  })

  it('runs preflight in CI', () => {
    expect(runsScript(CI, 'preflight')).toBe(true)
  })

  // The defect: this was false.
  it('runs the Playwright E2E suite in CI', () => {
    expect(runsScript(CI, 'test:e2e')).toBe(true)
  })

  // The e2e job runs in the official Playwright image so browsers and system
  // libraries are preinstalled. Installing them per run took >10 minutes on one
  // runner and hit timeout-minutes (reported as `cancelled`). The image tag has
  // to track the @playwright/test version or the browsers will not match.
  it('pins the Playwright image to the installed @playwright/test version', () => {
    const installed = (
      JSON.parse(
        readFileSync(resolve(ROOT, 'node_modules/@playwright/test/package.json'), 'utf-8'),
      ) as {
        version: string
      }
    ).version
    const image = CI.match(/mcr\.microsoft\.com\/playwright:v([\d.]+)-/)

    expect(image, 'no Playwright container image in ci.yml').not.toBeNull()
    expect(image?.[1]).toBe(installed)
  })

  it('builds the app before running E2E (preview serves dist/)', () => {
    expect(runsScript(CI, 'build')).toBe(true)
  })
})

describe('e03s02 declares the files that implement it', () => {
  it.each(['playwright.config.ts', 'tests/e2e/smoke.test.ts', '.github/workflows/ci.yml'])(
    '%s exists',
    (file) => {
      expect(() => readFileSync(resolve(ROOT, file))).not.toThrow()
    },
  )
})
