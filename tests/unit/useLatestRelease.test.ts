// story: e02s01
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
  return vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(fixture) })
}

function createHangingFetch() {
  return vi.fn(
    (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const err = new Error('Aborted')
          err.name = 'AbortError'
          reject(err)
        })
      }),
  )
}

describe('useLatestRelease', () => {
  let fetchMock: ReturnType<typeof vi.fn>
  let capturedVisibilityListeners: EventListener[]

  beforeEach(() => {
    capturedVisibilityListeners = []
    const origAddEventListener = document.addEventListener.bind(document)
    vi.spyOn(document, 'addEventListener').mockImplementation(((
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ) => {
      if (type === 'visibilitychange' && listener) {
        capturedVisibilityListeners.push(listener as EventListener)
      }
      origAddEventListener(type, listener!, options)
    }) as typeof document.addEventListener)
    vi.resetModules()
    fetchMock = createMockFetch()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    capturedVisibilityListeners.forEach((fn) =>
      document.removeEventListener('visibilitychange', fn),
    )
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('fetches from the correct GitHub API URL on first call', async () => {
    const { useLatestRelease } = await import('../../src/composables/useLatestRelease')
    useLatestRelease()
    await flushPromises()
    expect(fetchMock).toHaveBeenCalledWith(
      API_URL,
      expect.objectContaining({ signal: expect.anything() }),
    )
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

  it('treats a non-OK HTTP response as an error instead of a successful empty release', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ message: 'API rate limit exceeded' }),
    })
    const { useLatestRelease } = await import('../../src/composables/useLatestRelease')
    const { release, error, loading } = useLatestRelease()
    await flushPromises()
    expect(error.value).toBe(true)
    expect(release.value).toBe(null)
    expect(loading.value).toBe(false)
  })

  it('sets error=true and leaves release=null when fetch rejects', async () => {
    fetchMock.mockRejectedValue(new Error('network error'))
    const { useLatestRelease } = await import('../../src/composables/useLatestRelease')
    const { release, error } = useLatestRelease()
    await flushPromises()
    expect(error.value).toBe(true)
    expect(release.value).toBe(null)
  })

  it('recovers from a failed initial load after visibilitychange (retry transition)', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'))
    const { useLatestRelease } = await import('../../src/composables/useLatestRelease')
    const { release, error, loading } = useLatestRelease()
    await flushPromises()
    expect(error.value).toBe(true)
    expect(release.value).toBe(null)

    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(FIXTURE) })
    document.dispatchEvent(new Event('visibilitychange'))
    await flushPromises()

    expect(loading.value).toBe(false)
    expect(error.value).toBe(false)
    expect(release.value?.tag).toBe('v1.3.0')
  })

  it('recovers from a failed initial load via the exposed retry() function', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'))
    const { useLatestRelease } = await import('../../src/composables/useLatestRelease')
    const { release, error, retry } = useLatestRelease()
    await flushPromises()
    expect(error.value).toBe(true)

    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(FIXTURE) })
    retry()
    await flushPromises()

    expect(error.value).toBe(false)
    expect(release.value?.tag).toBe('v1.3.0')
  })

  it('retries when a new consumer calls useLatestRelease after a failed initial load', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'))
    const { useLatestRelease } = await import('../../src/composables/useLatestRelease')
    const first = useLatestRelease()
    await flushPromises()
    expect(first.error.value).toBe(true)

    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(FIXTURE) })
    const second = useLatestRelease()
    await flushPromises()

    expect(second.error.value).toBe(false)
    expect(second.release.value?.tag).toBe('v1.3.0')
  })

  it('fails when the initial load times out', async () => {
    vi.useFakeTimers()
    fetchMock = createHangingFetch()
    vi.stubGlobal('fetch', fetchMock)

    const { useLatestRelease } = await import('../../src/composables/useLatestRelease')
    const { release, error, loading } = useLatestRelease({ timeoutMs: 50 })
    expect(loading.value).toBe(true)

    await vi.advanceTimersByTimeAsync(50)

    expect(error.value).toBe(true)
    expect(release.value).toBe(null)
    expect(loading.value).toBe(false)
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

  it('keeps an optimistic increment when a refetch lands', async () => {
    const { useLatestRelease } = await import('../../src/composables/useLatestRelease')
    const { release, incrementDownload } = useLatestRelease()
    await flushPromises()

    incrementDownload('apple-silicon')
    expect(release.value?.downloads.silicon).toBe(81)
    expect(release.value?.downloads.total).toBe(101)

    document.dispatchEvent(new Event('visibilitychange'))
    await flushPromises()

    expect(release.value?.downloads.silicon).toBe(81)
    expect(release.value?.downloads.total).toBe(101)
  })

  it('keeps the last good release when a background refresh fails', async () => {
    const { useLatestRelease } = await import('../../src/composables/useLatestRelease')
    const { release, error } = useLatestRelease()
    await flushPromises()
    expect(release.value?.tag).toBe('v1.3.0')

    fetchMock.mockRejectedValue(new Error('network down'))
    document.dispatchEvent(new Event('visibilitychange'))
    await flushPromises()

    expect(release.value?.tag).toBe('v1.3.0')
    expect(error.value).toBe(false)
  })

  it('keeps the last good release when a background refresh times out', async () => {
    vi.useFakeTimers()
    const { useLatestRelease } = await import('../../src/composables/useLatestRelease')
    const { release, error, loading } = useLatestRelease({ timeoutMs: 100 })
    await vi.advanceTimersByTimeAsync(0)
    expect(release.value?.tag).toBe('v1.3.0')

    fetchMock.mockImplementation(createHangingFetch())
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(0)
    expect(loading.value).toBe(true)

    await vi.advanceTimersByTimeAsync(100)

    expect(release.value?.tag).toBe('v1.3.0')
    expect(error.value).toBe(false)
    expect(loading.value).toBe(false)
  })

  it('coalesces visibilitychange during an in-flight load into a follow-up refresh', async () => {
    const pending: Array<(value: unknown) => void> = []
    fetchMock.mockImplementation(
      () => new Promise((resolve) => pending.push(resolve as (value: unknown) => void)),
    )

    const { useLatestRelease } = await import('../../src/composables/useLatestRelease')
    const { release } = useLatestRelease()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    document.dispatchEvent(new Event('visibilitychange'))
    await Promise.resolve()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    pending[0]({ ok: true, status: 200, json: () => Promise.resolve(FIXTURE) })
    await flushPromises()
    expect(fetchMock).toHaveBeenCalledTimes(2)

    pending[1]({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ...FIXTURE, tag_name: 'v1.4.0' }),
    })
    await flushPromises()

    expect(release.value?.tag).toBe('v1.4.0')
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

  it('registers the visibilitychange listener once and removes it on dispose', async () => {
    const { useLatestRelease } = await import('../../src/composables/useLatestRelease')
    const { dispose } = useLatestRelease()
    await flushPromises()

    expect(capturedVisibilityListeners).toHaveLength(1)
    useLatestRelease()
    expect(capturedVisibilityListeners).toHaveLength(1)

    dispose()
    const callsAfterDispose = fetchMock.mock.calls.length
    document.dispatchEvent(new Event('visibilitychange'))
    await flushPromises()

    expect(fetchMock.mock.calls.length).toBe(callsAfterDispose)
  })
})
