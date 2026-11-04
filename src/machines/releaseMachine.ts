export interface Asset {
  name: string
  browser_download_url: string
  download_count: number
}

export interface ReleaseDownloads {
  silicon: number
  intel: number
  total: number
}

export interface Release {
  tag: string
  silicon: string
  intel: string
  downloads: ReleaseDownloads
}

export type DownloadArch = 'apple-silicon' | 'intel'

export type FailureReason = 'http' | 'network' | 'parse' | 'timeout'

export interface PendingIncrements {
  silicon: number
  intel: number
}

export type ReleaseState =
  | { status: 'idle' }
  | { status: 'loading'; queued: boolean }
  | { status: 'ready'; release: Release; pending: PendingIncrements }
  | { status: 'refreshing'; release: Release; pending: PendingIncrements; queued: boolean }
  | { status: 'failed'; reason: FailureReason }

export type ReleaseEvent =
  | { type: 'USE' }
  | { type: 'VISIBLE' }
  | { type: 'FETCH_OK'; release: Release }
  | { type: 'FETCH_ERR'; reason: FailureReason }
  | { type: 'INCREMENT'; arch: DownloadArch }

export const DEFAULT_TIMEOUT_MS = 10_000

const NO_PENDING: PendingIncrements = { silicon: 0, intel: 0 }

export function createInitialState(): ReleaseState {
  return { status: 'idle' }
}

function withIncrement(
  release: Release,
  pending: PendingIncrements,
  arch: DownloadArch,
): { release: Release; pending: PendingIncrements } {
  const nextPending: PendingIncrements = {
    silicon: pending.silicon + (arch === 'apple-silicon' ? 1 : 0),
    intel: pending.intel + (arch === 'intel' ? 1 : 0),
  }
  return {
    release: mergePending(release, nextPending),
    pending: nextPending,
  }
}

function mergePending(release: Release, pending: PendingIncrements): Release {
  const silicon = release.downloads.silicon + pending.silicon
  const intel = release.downloads.intel + pending.intel
  return {
    ...release,
    downloads: { silicon, intel, total: silicon + intel },
  }
}

function reconcile(
  server: Release,
  previous: Release,
  pending: PendingIncrements,
): { release: Release; pending: PendingIncrements } {
  const previousServerSilicon = previous.downloads.silicon - pending.silicon
  const previousServerIntel = previous.downloads.intel - pending.intel
  const acknowledgedSilicon = Math.max(0, server.downloads.silicon - previousServerSilicon)
  const acknowledgedIntel = Math.max(0, server.downloads.intel - previousServerIntel)
  const nextPending: PendingIncrements = {
    silicon: Math.max(0, pending.silicon - acknowledgedSilicon),
    intel: Math.max(0, pending.intel - acknowledgedIntel),
  }
  const merged = mergePending(server, nextPending)

  // Server truth should never make the visible counts go backwards.
  const silicon = Math.max(merged.downloads.silicon, previous.downloads.silicon)
  const intel = Math.max(merged.downloads.intel, previous.downloads.intel)

  return {
    release: { ...merged, downloads: { silicon, intel, total: silicon + intel } },
    pending: nextPending,
  }
}

export function releaseReducer(state: ReleaseState, event: ReleaseEvent): ReleaseState {
  switch (event.type) {
    case 'USE': {
      if (state.status === 'idle' || state.status === 'failed') {
        return { status: 'loading', queued: false }
      }
      return state
    }

    case 'VISIBLE': {
      switch (state.status) {
        case 'idle':
          return { status: 'loading', queued: false }
        case 'failed':
          return { status: 'loading', queued: false }
        case 'ready':
          return {
            status: 'refreshing',
            release: state.release,
            pending: state.pending,
            queued: false,
          }
        case 'loading':
          return { ...state, queued: true }
        case 'refreshing':
          return { ...state, queued: true }
      }
      return state
    }

    case 'FETCH_OK': {
      if (state.status === 'loading') {
        if (state.queued) {
          return {
            status: 'refreshing',
            release: event.release,
            pending: NO_PENDING,
            queued: false,
          }
        }
        return { status: 'ready', release: event.release, pending: NO_PENDING }
      }

      if (state.status === 'refreshing') {
        const { release, pending } = reconcile(event.release, state.release, state.pending)
        if (state.queued) {
          return { status: 'refreshing', release, pending, queued: false }
        }
        return { status: 'ready', release, pending }
      }

      return state
    }

    case 'FETCH_ERR': {
      if (state.status === 'loading') {
        if (state.queued) return { status: 'loading', queued: false }
        return { status: 'failed', reason: event.reason }
      }

      if (state.status === 'refreshing') {
        if (state.queued) {
          return { ...state, queued: false }
        }
        return { status: 'ready', release: state.release, pending: state.pending }
      }

      return state
    }

    case 'INCREMENT': {
      if (state.status === 'ready' || state.status === 'refreshing') {
        return {
          ...state,
          ...withIncrement(state.release, state.pending, event.arch),
        }
      }
      return state
    }
  }
}
