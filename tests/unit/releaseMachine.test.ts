import { createInitialState, releaseReducer } from '../../src/machines/releaseMachine'
import type { Release } from '../../src/machines/releaseMachine'

const SERVER_RELEASE: Release = {
  tag: 'v1.3.0',
  silicon: 'https://example.com/v1.3.0/apple-silicon.dmg',
  intel: 'https://example.com/v1.3.0/intel.dmg',
  downloads: { silicon: 80, intel: 20, total: 100 },
}

describe('releaseMachine', () => {
  it('starts idle', () => {
    expect(createInitialState()).toEqual({ status: 'idle' })
  })

  it('USE from idle enters loading', () => {
    const state = releaseReducer(createInitialState(), { type: 'USE' })
    expect(state).toEqual({ status: 'loading', queued: false })
  })

  it('FETCH_OK from loading enters ready', () => {
    const state = releaseReducer(
      { status: 'loading', queued: false },
      { type: 'FETCH_OK', release: SERVER_RELEASE },
    )
    expect(state.status).toBe('ready')
    if (state.status === 'ready') {
      expect(state.release.tag).toBe('v1.3.0')
      expect(state.pending).toEqual({ silicon: 0, intel: 0 })
    }
  })

  it('FETCH_ERR from loading enters failed', () => {
    const state = releaseReducer(
      { status: 'loading', queued: false },
      { type: 'FETCH_ERR', reason: 'timeout' },
    )
    expect(state).toEqual({ status: 'failed', reason: 'timeout' })
  })

  it('VISIBLE from ready enters refreshing', () => {
    const state = releaseReducer(
      { status: 'ready', release: SERVER_RELEASE, pending: { silicon: 0, intel: 0 } },
      { type: 'VISIBLE' },
    )
    expect(state.status).toBe('refreshing')
    if (state.status === 'refreshing') expect(state.release).toBe(SERVER_RELEASE)
  })

  it('FETCH_ERR from refreshing keeps the last good release without failing', () => {
    const state = releaseReducer(
      {
        status: 'refreshing',
        release: SERVER_RELEASE,
        pending: { silicon: 0, intel: 0 },
        queued: false,
      },
      { type: 'FETCH_ERR', reason: 'timeout' },
    )
    expect(state.status).toBe('ready')
    if (state.status === 'ready') expect(state.release).toBe(SERVER_RELEASE)
  })

  it('VISIBLE from failed retries with loading', () => {
    const state = releaseReducer({ status: 'failed', reason: 'network' }, { type: 'VISIBLE' })
    expect(state).toEqual({ status: 'loading', queued: false })
  })

  it('VISIBLE during loading is queued and triggers a refresh after FETCH_OK', () => {
    const queued = releaseReducer({ status: 'loading', queued: false }, { type: 'VISIBLE' })
    expect(queued).toEqual({ status: 'loading', queued: true })

    const settled = releaseReducer(queued, { type: 'FETCH_OK', release: SERVER_RELEASE })
    expect(settled.status).toBe('refreshing')
    if (settled.status === 'refreshing') expect(settled.queued).toBe(false)
  })

  it('VISIBLE during refreshing is queued and retries after FETCH_ERR', () => {
    const refreshing = {
      status: 'refreshing' as const,
      release: SERVER_RELEASE,
      pending: { silicon: 0, intel: 0 },
      queued: false,
    }
    const queued = releaseReducer(refreshing, { type: 'VISIBLE' })
    expect(queued).toEqual({ ...refreshing, queued: true })

    const settled = releaseReducer(queued, { type: 'FETCH_ERR', reason: 'timeout' })
    expect(settled.status).toBe('refreshing')
    if (settled.status === 'refreshing') expect(settled.queued).toBe(false)
  })

  it('INCREMENT raises pending and FETCH_OK merges it into server counts', () => {
    const ready = releaseReducer(
      { status: 'ready', release: SERVER_RELEASE, pending: { silicon: 0, intel: 0 } },
      { type: 'INCREMENT', arch: 'apple-silicon' },
    )
    expect(ready.status).toBe('ready')
    if (ready.status !== 'ready') return
    expect(ready.release.downloads.silicon).toBe(81)
    expect(ready.pending).toEqual({ silicon: 1, intel: 0 })

    const refreshed = releaseReducer(
      { status: 'refreshing', release: ready.release, pending: ready.pending, queued: false },
      { type: 'FETCH_OK', release: SERVER_RELEASE },
    )
    expect(refreshed.status).toBe('ready')
    if (refreshed.status === 'ready') {
      expect(refreshed.release.downloads.silicon).toBe(81)
      expect(refreshed.release.downloads.total).toBe(101)
    }
  })

  it('acknowledged optimistic increments are not double counted', () => {
    const ready = {
      status: 'ready' as const,
      release: { ...SERVER_RELEASE, downloads: { silicon: 81, intel: 20, total: 101 } },
      pending: { silicon: 1, intel: 0 },
    }
    const acknowledged = {
      ...SERVER_RELEASE,
      downloads: { silicon: 81, intel: 20, total: 101 },
    }

    const refreshed = releaseReducer(
      { status: 'refreshing', release: ready.release, pending: ready.pending, queued: false },
      { type: 'FETCH_OK', release: acknowledged },
    )
    expect(refreshed.status).toBe('ready')
    if (refreshed.status === 'ready') {
      expect(refreshed.pending).toEqual({ silicon: 0, intel: 0 })
      expect(refreshed.release.downloads.silicon).toBe(81)
      expect(refreshed.release.downloads.total).toBe(101)
    }
  })

  it('a refetch never lowers the displayed counts', () => {
    const ready = {
      status: 'ready' as const,
      release: { ...SERVER_RELEASE, downloads: { silicon: 81, intel: 20, total: 101 } },
      pending: { silicon: 1, intel: 0 },
    }
    const decreased = {
      ...SERVER_RELEASE,
      downloads: { silicon: 70, intel: 10, total: 80 },
    }

    const refreshed = releaseReducer(
      { status: 'refreshing', release: ready.release, pending: ready.pending, queued: false },
      { type: 'FETCH_OK', release: decreased },
    )
    expect(refreshed.status).toBe('ready')
    if (refreshed.status === 'ready') {
      expect(refreshed.release.downloads.silicon).toBe(81)
      expect(refreshed.release.downloads.intel).toBe(20)
    }
  })
})
