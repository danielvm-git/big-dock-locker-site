// story: BUG-001
// husky runs every hook through `.husky/_/h`, which ends with `sh -e "$s"`.
// On Debian/Ubuntu (GitHub Actions ubuntu-latest) `sh` is dash, not bash.
// A hook written with bash-only syntax therefore misbehaves on CI.
//
// Two failure modes, and only the first is caught by `dash -n`:
//   1. `[[ ... =~ ...(a|b) ]]` is a *parse* error -> the whole hook aborts.
//   2. `[[ ... ]]` alone parses fine (it reads as a command named `[[`) but
//      dies at runtime, so every `if` guard silently becomes false. That is
//      how `.husky/commit-msg` came to reject every commit on Linux, including
//      big-release's own `chore(release): ...` commit.
//
// Probe dash first: a macOS dev box has /bin/sh -> bash, which would happily
// accept bash-isms and hide both defects locally.
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

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

function runHook(hook: string, args: string[] = [], stdin = '', env: Record<string, string> = {}) {
  return spawnSync(SHELL, ['-e', join(HUSKY_DIR, hook), ...args], {
    input: stdin,
    encoding: 'utf-8',
    env: { ...process.env, GIT_BIGPOWERS_LAND: '0', ...env },
  })
}

const refLine = (remoteRef: string) =>
  `refs/heads/feature/x 1111111111111111111111111111111111111111 ${remoteRef} 2222222222222222222222222222222222222222\n`

const TMP = mkdtempSync(join(tmpdir(), 'husky-hooks-'))
afterAll(() => rmSync(TMP, { recursive: true, force: true }))

let seq = 0
function commitMsg(message: string): string {
  const file = join(TMP, `msg-${seq++}.txt`)
  writeFileSync(file, message, 'utf-8')
  return file
}

const checkMsg = (message: string) => runHook('commit-msg', [commitMsg(message)])

describe('husky hooks are POSIX sh', () => {
  it('finds the hook files', () => {
    expect(HOOKS).toEqual(expect.arrayContaining(['commit-msg', 'pre-commit', 'pre-push']))
  })

  it.each(HOOKS)('%s parses under the shell husky uses', (hook) => {
    const result = spawnSync(SHELL, ['-n', join(HUSKY_DIR, hook)], { encoding: 'utf-8' })

    expect(result.stderr.trim()).toBe('')
    expect(result.status).toBe(0)
  })

  // `dash -n` is not enough: it accepts `[[`. Scan the executable lines for
  // constructs dash cannot run. Full-line comments are skipped so the hooks can
  // still explain themselves.
  const BASH_ISMS: Array<[string, RegExp]> = [
    ['double-bracket test', /\[\[/],
    ['regex match operator', / =~ /],
    ['here-string', /<<</],
    ['function keyword', /^\s*function\s/],
    ['source builtin', /^\s*source\s/],
    ['pipefail option', /pipefail/],
    ['ANSI-C quoting', /(^|[\s=(])\$'/],
  ]

  it.each(HOOKS)('%s uses no bash-only constructs', (hook) => {
    const code = readFileSync(join(HUSKY_DIR, hook), 'utf-8')
      .split('\n')
      .filter((line) => !/^\s*#/.test(line))

    const offenders = BASH_ISMS.filter(([, pattern]) =>
      code.some((line) => pattern.test(line)),
    ).map(([name]) => name)

    expect(offenders).toEqual([])
  })
})

describe('pre-push guard', () => {
  it('allows a tag push', () => {
    const result = runHook('pre-push', [], refLine('refs/tags/v1.6.0'))

    expect(result.stderr).not.toContain('Syntax error')
    expect(result.status).toBe(0)
  })

  it('allows a feature-branch push', () => {
    expect(runHook('pre-push', [], refLine('refs/heads/feature/x')).status).toBe(0)
  })

  it.each(['refs/heads/main', 'refs/heads/master'])('blocks a direct push to %s', (remoteRef) => {
    const result = runHook('pre-push', [], refLine(remoteRef))

    expect(result.status).toBe(1)
    expect(result.stderr).toContain(`Direct push to protected branch '${remoteRef}' is blocked`)
  })

  it.each(['refs/heads/main', 'refs/heads/master'])(
    'allows a sanctioned landing push to %s',
    (remoteRef) => {
      expect(runHook('pre-push', [], refLine(remoteRef), { GIT_BIGPOWERS_LAND: '1' }).status).toBe(
        0,
      )
    },
  )

  it('exits 0 when git passes no refs', () => {
    expect(runHook('pre-push', [], '').status).toBe(0)
  })
})

describe('commit-msg guard', () => {
  it.each([
    'feat(e02): live github releases and install section',
    'fix(ci): make pre-push hook POSIX',
    'fix: thing',
    'chore: thing',
    'refactor(api)!: drop v1',
    // The exact message big-release commits after tagging. It is valid
    // Conventional Commits; the old bash-only hook rejected it.
    'chore(release): update version files to 1.6.0 [skip ci]',
  ])('accepts %s', (message) => {
    const result = checkMsg(message)

    expect(result.stderr).not.toContain('not found')
    expect(result.status).toBe(0)
  })

  it.each(["Merge branch 'main' into feature/x", 'Merge pull request #11 from x', 'v1.6.0'])(
    'accepts the non-conventional escape hatch %s',
    (message) => {
      expect(checkMsg(message).status).toBe(0)
    },
  )

  it('rejects a non-conventional subject', () => {
    const result = checkMsg('nope, not conventional')

    expect(result.status).toBe(1)
    expect(result.stdout).toContain('does not follow Conventional Commits format')
  })

  it('rejects an AI Co-authored-by trailer', () => {
    const result = checkMsg('feat: add thing\n\nCo-authored-by: Claude <noreply@anthropic.com>\n')

    expect(result.status).toBe(1)
    expect(result.stdout).toContain('AI attribution in commits is forbidden')
  })
})
