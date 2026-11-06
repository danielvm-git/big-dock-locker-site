// story: BUG-007
// Sentry is observability, not content: it must never sit on the critical path.
// `src/main.ts` used to `import * as Sentry from '@sentry/vue'` and call
// Sentry.init() before app.mount(), which forced Vue, the app and the whole
// SDK (tracing + session replay) into one blocking 113 KB gzip chunk.
//
// This guards the contract of the lazy facade: the SDK is only fetched when the
// page is idle, events raised before it arrives are not lost, and nothing about
// observability can throw into the render path.
const sdk = {
  init: vi.fn(),
  addBreadcrumb: vi.fn(),
  captureMessage: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })),
  replayIntegration: vi.fn(() => ({ name: 'Replay' })),
}

vi.mock('@sentry/vue', () => sdk)

type Facade = typeof import('../../src/observability/sentry')

async function loadFacade(): Promise<Facade> {
  vi.resetModules()
  return import('../../src/observability/sentry')
}

const app = { version: '3.5.0' } as unknown as Parameters<Facade['initSentry']>[0]

describe('the Sentry facade keeps the SDK off the critical path', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not initialise the SDK when the module is imported', async () => {
    await loadFacade()
    expect(sdk.init).not.toHaveBeenCalled()
  })

  it('does not download the SDK until initSentry is called', async () => {
    const facade = await loadFacade()
    facade.addBreadcrumb({ category: 'download', message: 'download_clicked' })
    expect(sdk.init).not.toHaveBeenCalled()
  })

  it('initialises the SDK with the app, release and sampling config', async () => {
    const facade = await loadFacade()
    await facade.initSentry(app)

    expect(sdk.init).toHaveBeenCalledTimes(1)
    const options = sdk.init.mock.calls[0][0] as Record<string, unknown>
    expect(options.app).toBe(app)
    expect(options.dsn).toMatch(/^https:\/\//)
    expect(options.release).toBe('big-dock-locker-site@0.0.0')
    expect(options.tracesSampleRate).toBe(1.0)
    expect(options.sendDefaultPii).toBe(false)
  })

  it('delivers events raised before the SDK arrives instead of dropping them', async () => {
    const facade = await loadFacade()
    facade.addBreadcrumb({ category: 'download', message: 'early_breadcrumb' })
    facade.captureMessage('early_message', { level: 'info', tags: { arch: 'intel' } })

    expect(sdk.addBreadcrumb).not.toHaveBeenCalled()

    await facade.initSentry(app)

    expect(sdk.addBreadcrumb).toHaveBeenCalledWith({
      category: 'download',
      message: 'early_breadcrumb',
    })
    expect(sdk.captureMessage).toHaveBeenCalledWith('early_message', {
      level: 'info',
      tags: { arch: 'intel' },
    })
  })

  it('forwards events raised after the SDK arrives immediately', async () => {
    const facade = await loadFacade()
    await facade.initSentry(app)
    facade.addBreadcrumb({ category: 'download', message: 'late_breadcrumb' })

    expect(sdk.addBreadcrumb).toHaveBeenCalledWith({
      category: 'download',
      message: 'late_breadcrumb',
    })
  })

  it('defers the SDK to idle time rather than first paint', async () => {
    vi.useFakeTimers()
    const facade = await loadFacade()
    facade.scheduleSentry(app)

    expect(sdk.init).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(5000)
    expect(sdk.init).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('never throws into the render path when the SDK fails to initialise', async () => {
    sdk.init.mockImplementationOnce(() => {
      throw new Error('blocked by an extension')
    })
    const facade = await loadFacade()

    await expect(facade.initSentry(app)).resolves.toBeUndefined()
    expect(() => facade.addBreadcrumb({ message: 'after_failure' })).not.toThrow()
  })
})
