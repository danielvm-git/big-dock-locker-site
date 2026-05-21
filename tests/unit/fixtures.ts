import { ref } from 'vue'
import type { useLatestRelease } from '../../src/composables/useLatestRelease'
import { vi } from 'vitest'

export const RELEASE_FIXTURE = {
  tag: 'v1.3.0',
  silicon: 'https://example.com/v1.3.0/apple-silicon.dmg',
  intel: 'https://example.com/v1.3.0/intel.dmg',
  downloads: { silicon: 80, intel: 20, total: 100 },
}

type UseLatestReleaseReturn = ReturnType<typeof useLatestRelease>

export function makeMockReturn(
  opts: { loading?: boolean; error?: boolean; release?: typeof RELEASE_FIXTURE | null } = {},
): UseLatestReleaseReturn {
  return {
    release: ref(opts.release !== undefined ? opts.release : RELEASE_FIXTURE),
    loading: ref(opts.loading ?? false),
    error: ref(opts.error ?? false),
    incrementDownload: vi.fn(),
  } as UseLatestReleaseReturn
}
