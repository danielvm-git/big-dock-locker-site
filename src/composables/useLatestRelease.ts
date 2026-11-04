import { computed, shallowRef } from 'vue'
import { DEFAULT_TIMEOUT_MS, createInitialState, releaseReducer } from '../machines/releaseMachine'
import type {
  Asset,
  DownloadArch,
  FailureReason,
  Release,
  ReleaseEvent,
  ReleaseState,
} from '../machines/releaseMachine'

interface GitHubReleasePayload {
  tag_name?: string
  assets?: Asset[]
}

interface UseLatestReleaseOptions {
  timeoutMs?: number
}

const API_URL = 'https://api.github.com/repos/danielvm-git/big-dock-locker/releases/latest'
const FALLBACK = 'https://github.com/danielvm-git/big-dock-locker/releases/latest'

const state = shallowRef<ReleaseState>(createInitialState())

let timeoutMs = DEFAULT_TIMEOUT_MS
let controller: AbortController | null = null
let timeoutHandle: ReturnType<typeof setTimeout> | null = null
let generation = 0
let listenerAttached = false
let visibilityHandler: (() => void) | null = null

const release = computed<Release | null>(() => {
  const current = state.value
  return current.status === 'ready' || current.status === 'refreshing' ? current.release : null
})
const loading = computed(
  () => state.value.status === 'loading' || state.value.status === 'refreshing',
)
const error = computed(() => state.value.status === 'failed')

function dispatch(event: ReleaseEvent) {
  state.value = releaseReducer(state.value, event)
}

function createHttpError(status: number) {
  const err = new Error(`GitHub API responded with ${status}`) as Error & { isHttp?: boolean }
  err.isHttp = true
  return err
}

function classifyFailure(err: unknown): FailureReason {
  if (err instanceof SyntaxError) return 'parse'
  if (typeof err === 'object' && err !== null && (err as { isHttp?: boolean }).isHttp) return 'http'
  return 'network'
}

function parseRelease(data: GitHubReleasePayload): Release {
  const siliconAsset = data.assets?.find((a) => a.name.includes('apple-silicon'))
  const intelAsset = data.assets?.find((a) => a.name.includes('intel'))
  const siliconCount = siliconAsset?.download_count ?? 0
  const intelCount = intelAsset?.download_count ?? 0
  return {
    tag: data.tag_name ?? '',
    silicon: siliconAsset?.browser_download_url ?? FALLBACK,
    intel: intelAsset?.browser_download_url ?? FALLBACK,
    downloads: {
      silicon: siliconCount,
      intel: intelCount,
      total: siliconCount + intelCount,
    },
  }
}

function clearTimer() {
  if (timeoutHandle !== null) {
    clearTimeout(timeoutHandle)
    timeoutHandle = null
  }
}

function startFetch() {
  if (controller) return

  const currentGeneration = ++generation
  const currentController = new AbortController()
  controller = currentController
  let timedOut = false

  timeoutHandle = setTimeout(() => {
    timedOut = true
    currentController.abort()
  }, timeoutMs)

  fetch(API_URL, { signal: currentController.signal })
    .then((response) => {
      if (!response.ok) throw createHttpError(response.status)
      return response.json()
    })
    .then((data: GitHubReleasePayload) => {
      settle(currentGeneration, () => ({
        type: 'FETCH_OK',
        release: parseRelease(data),
      }))
    })
    .catch((err: unknown) => {
      settle(currentGeneration, () => ({
        type: 'FETCH_ERR',
        reason: timedOut ? 'timeout' : classifyFailure(err),
      }))
    })
}

function settle(currentGeneration: number, event: () => ReleaseEvent) {
  if (currentGeneration !== generation) return
  clearTimer()
  controller = null
  dispatch(event())
  maybeStartFetch()
}

function maybeStartFetch() {
  if (controller) return
  if (state.value.status === 'loading' || state.value.status === 'refreshing') {
    startFetch()
  }
}

function incrementDownload(arch: DownloadArch) {
  dispatch({ type: 'INCREMENT', arch })
}

function retry() {
  if (state.value.status !== 'idle' && state.value.status !== 'failed') return
  dispatch({ type: 'USE' })
  maybeStartFetch()
}

function ensureListener() {
  if (listenerAttached || typeof document === 'undefined') return
  visibilityHandler = () => {
    if (document.visibilityState !== 'visible') return
    dispatch({ type: 'VISIBLE' })
    maybeStartFetch()
  }
  document.addEventListener('visibilitychange', visibilityHandler)
  listenerAttached = true
}

function dispose() {
  // Invalidate any in-flight settle callback, then release owned resources.
  generation += 1
  clearTimer()
  controller?.abort()
  controller = null
  if (listenerAttached && visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler)
    listenerAttached = false
    visibilityHandler = null
  }
  state.value = createInitialState()
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => dispose())
}

export function useLatestRelease(options: UseLatestReleaseOptions = {}) {
  if (options.timeoutMs !== undefined) timeoutMs = options.timeoutMs

  ensureListener()

  if (state.value.status === 'idle' || state.value.status === 'failed') {
    dispatch({ type: 'USE' })
    maybeStartFetch()
  }

  return {
    release,
    loading,
    error,
    incrementDownload,
    retry,
    dispose,
  }
}
