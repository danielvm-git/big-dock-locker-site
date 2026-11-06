// story: BUG-001
// husky runs every hook through `.husky/_/h`, which ends with `sh -e "$s"`.
// On Debian/Ubuntu (GitHub Actions ubuntu-latest) `sh` is dash, not bash.
// A hook written with bash-only syntax therefore aborts with a parse error on
// CI, and every `git push` made by the Release workflow fails.
//
// Probe dash first: a macOS dev box has /bin/sh -> bash, which would happily
// accept bash-isms and hide the defect locally.
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const HUSKY_DIR = resolve(process.cwd(), '.husky')

function posixShell(): string {
  const candidates = ['/bin/dash', '/usr/bin/dash', '/bin/sh']
  return candidates.find((candidate) => existsSync(candidate)) ?? '/bin/sh'
}

const SHELL = posixShell()

const HOOKS = readdirSync(HUSKY_DIR, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .sort()

function runHook(hook: string, stdin: string, env: Record<string, string> = {}) {
  return spawnSync(SHELL, ['-e', join(HUSKY_DIR, hook)], {
    input: stdin,
    encoding: 'utf-8',
    env: { ...process.env, GIT_BIGPOWERS_LAND: '0', ...env },
  })
}

const refLine = (remoteRef: string) =>
  `refs/heads/feature/x 1111111111111111111111111111111111111111 ${remoteRef} 2222222222222222222222222222222222222222\n`

describe('husky hooks are POSIX sh', () => {
  it('finds the hook files', () => {
    expect(HOOKS).toEqual(expect.arrayContaining(['commit-msg', 'pre-commit', 'pre-push']))
  })

  it.each(HOOKS)('%s parses under the shell husky uses', (hook) => {
    const result = spawnSync(SHELL, ['-n', join(HUSKY_DIR, hook)], { encoding: 'utf-8' })

    expect(result.stderr.trim()).toBe('')
    expect(result.status).toBe(0)
  })
})

describe('pre-push guard', () => {
  it('allows a tag push', () => {
    const result = runHook('pre-push', refLine('refs/tags/v1.6.0'))

    expect(result.stderr).not.toContain('Syntax error')
    expect(result.status).toBe(0)
  })

  it('allows a feature-branch push', () => {
    const result = runHook('pre-push', refLine('refs/heads/feature/x'))

    expect(result.status).toBe(0)
  })

  it.each(['refs/heads/main', 'refs/heads/master'])('blocks a direct push to %s', (remoteRef) => {
    const result = runHook('pre-push', refLine(remoteRef))

    expect(result.status).toBe(1)
    expect(result.stderr).toContain(`Direct push to protected branch '${remoteRef}' is blocked`)
  })

  it.each(['refs/heads/main', 'refs/heads/master'])(
    'allows a sanctioned landing push to %s',
    (remoteRef) => {
      const result = runHook('pre-push', refLine(remoteRef), { GIT_BIGPOWERS_LAND: '1' })

      expect(result.status).toBe(0)
    },
  )

  it('exits 0 when git passes no refs', () => {
    expect(runHook('pre-push', '').status).toBe(0)
  })
})
