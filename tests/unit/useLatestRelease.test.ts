import { flushPromises } from '@vue/test-utils'

const API_URL = 'https://api.github.com/repos/danielvm-git/big-dock-locker/releases/latest'

const FIXTURE = {
  tag_name: 'v1.3.0',
  assets: [
    {
      name: 'big-dock-locker-apple-silicon.dmg',
      browser_download_url: 'https://example.com/v1.3.0/apple-silicon.dmg',
      download_count: 80,
    },
    {
      name: 'big-dock-locker-intel.dmg',
      browser_download_url: 'https://example.com/v1.3.0/intel.dmg',
      download_count: 20,
    },
  ],
}

function createMockFetch(fixture = FIXTURE) {
  return vi.fn().mockResolvedValue({ json: () => Promise.resolve(fixture) })
}

describe('useLatestRelease', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  let capturedVisibilityListeners: EventListener[]

  beforeEach(() => {
    capturedVisibilityListeners = []
    const origAddEventListener = document.addEventListener.bind(document)
    vi.spyOn(document, 'addEventListener').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (type: string, listener: any, options?: any) => {
        if (type === 'visibilitychange' && listener) {
          capturedVisibilityListeners.push(listener)
        }
        origAddEventListener(type, listener, options)
      },
    )
    vi.resetModules()
    fetchMock = createMockFetch()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    capturedVisibilityListeners.forEach((fn) =>
      document.removeEventListener('visibilitychange', fn),
    )
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('fetches from the correct GitHub API URL on first call', async () => {
    const { useLatestRelease } = await import('../../src/composables/useLatestRelease')
    useLatestRelease()
    await flushPromises()
    expect(fetchMock).toHaveBeenCalledWith(API_URL)
  })

  it('does not fetch twice when called again with release already loaded (singleton guard)', async () => {
    const { useLatestRelease } = await import('../../src/composables/useLatestRelease')
    useLatestRelease()
    await flushPromises()
    useLatestRelease()
    await flushPromises()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('parses silicon and intel download URLs from assets array', async () => {
    const { useLatestRelease } = await import('../../src/composables/useLatestRelease')
    const { release } = useLatestRelease()
    await flushPromises()
    expect(release.value?.silicon).toContain('apple-silicon')
    expect(release.value?.intel).toContain('intel')
  })

  it('extracts download_count for each arch and computes correct total', async () => {
    const { useLatestRelease } = await import('../../src/composables/useLatestRelease')
    const { release } = useLatestRelease()
    await flushPromises()
    expect(release.value?.downloads.silicon).toBe(80)
    expect(release.value?.downloads.intel).toBe(20)
    expect(release.value?.downloads.total).toBe(100)
  })

  it('sets error=true and leaves release=null when fetch rejects', async () => {
    fetchMock.mockRejectedValue(new Error('network error'))
    const { useLatestRelease } = await import('../../src/composables/useLatestRelease')
    const { release, error } = useLatestRelease()
    await flushPromises()
    expect(error.value).toBe(true)
    expect(release.value).toBe(null)
  })

  it("incrementDownload('apple-silicon') adds 1 to silicon and total, leaves intel unchanged", async () => {
    const { useLatestRelease } = await import('../../src/composables/useLatestRelease')
    const { release, incrementDownload } = useLatestRelease()
    await flushPromises()
    const before = { ...release.value!.downloads }
    incrementDownload('apple-silicon')
    expect(release.value!.downloads.silicon).toBe(before.silicon + 1)
    expect(release.value!.downloads.total).toBe(before.total + 1)
    expect(release.value!.downloads.intel).toBe(before.intel)
  })

  it("incrementDownload('intel') adds 1 to intel and total, leaves silicon unchanged", async () => {
    const { useLatestRelease } = await import('../../src/composables/useLatestRelease')
    const { release, incrementDownload } = useLatestRelease()
    await flushPromises()
    const before = { ...release.value!.downloads }
    incrementDownload('intel')
    expect(release.value!.downloads.intel).toBe(before.intel + 1)
    expect(release.value!.downloads.total).toBe(before.total + 1)
    expect(release.value!.downloads.silicon).toBe(before.silicon)
  })

  it('visibilitychange refetches when document becomes visible and release is already loaded', async () => {
    const { useLatestRelease } = await import('../../src/composables/useLatestRelease')
    useLatestRelease()
    await flushPromises()

    const callsAfterInit = fetchMock.mock.calls.length
    document.dispatchEvent(new Event('visibilitychange'))
    await flushPromises()

    expect(fetchMock.mock.calls.length).toBe(callsAfterInit + 1)
  })
})
