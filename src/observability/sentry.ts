// story: BUG-007
// Lazy Sentry facade.
//
// `@sentry/vue` used to be imported eagerly by `main.ts` and by the two
// components that track downloads, so Vue, the app and the whole SDK (tracing +
// session replay) shipped as one blocking chunk and had to be parsed before
// first render. Observability must never block the render: the SDK is fetched
// only once the page is idle, and calls made before it lands are queued rather
// than dropped, so the `download_clicked` events that arrive early still reach
// Sentry.
import type { App } from 'vue'

export interface Breadcrumb {
  category?: string
  message?: string
  level?: string
  data?: Record<string, unknown>
}

export interface CaptureContext {
  level?: string
  tags?: Record<string, string>
}

interface SentrySdk {
  init: (options: Record<string, unknown>) => void
  addBreadcrumb: (breadcrumb: Breadcrumb) => void
  captureMessage: (message: string, context?: CaptureContext) => void
}

const DSN =
  'https://6c4c063396e924e672faa745554e17c1@o4511429219450880.ingest.us.sentry.io/4511429223251968'

let sdk: SentrySdk | null = null
let queued: Array<(sdk: SentrySdk) => void> = []

function withSdk(job: (sdk: SentrySdk) => void): void {
  if (sdk) {
    job(sdk)
    return
  }
  queued.push(job)
}

/** Record a breadcrumb, whether or not the SDK has loaded yet. */
export function addBreadcrumb(breadcrumb: Breadcrumb): void {
  withSdk((loaded) => loaded.addBreadcrumb(breadcrumb))
}

/** Capture a message, whether or not the SDK has loaded yet. */
export function captureMessage(message: string, context?: CaptureContext): void {
  withSdk((loaded) => loaded.captureMessage(message, context))
}

/**
 * Download and initialise the SDK. Never rejects: a blocked or failed SDK is an
 * observability loss, never a page failure.
 */
export async function initSentry(app: App): Promise<void> {
  if (sdk) return

  let Sentry: typeof import('@sentry/vue')
  try {
    Sentry = await import('@sentry/vue')
  } catch {
    return
  }

  try {
    Sentry.init({
      app,
      dsn: DSN,
      release: `big-dock-locker-site@${__APP_VERSION__}`,
      environment: import.meta.env.MODE,
      integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
      tracesSampleRate: 1.0,
      tracePropagationTargets: ['localhost', /^https:\/\/bigdocklocker\.netlify\.app/],
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      sendDefaultPii: false,
      enableLogs: true,
    })
  } catch {
    return
  }

  sdk = Sentry as unknown as SentrySdk
  const flush = queued
  queued = []
  for (const job of flush) job(sdk)
}

/**
 * Schedule the SDK for after first paint. `requestIdleCallback` yields to the
 * render and to user input; the timeout bounds how long the queue can grow when
 * the page never goes idle. Browsers without it (and jsdom) fall back to a
 * timer.
 */
export function scheduleSentry(app: App, delayMs = 1000): void {
  if (typeof window === 'undefined') return

  const load = () => {
    void initSentry(app)
  }

  const idle = (window as Window & { requestIdleCallback?: typeof window.requestIdleCallback })
    .requestIdleCallback
  if (typeof idle === 'function') {
    idle(load, { timeout: 3000 })
    return
  }
  setTimeout(load, delayMs)
}
