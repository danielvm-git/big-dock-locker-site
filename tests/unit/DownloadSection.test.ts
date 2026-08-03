import { mount } from '@vue/test-utils'
import DownloadSection from '../../src/components/DownloadSection.vue'
import { useLatestRelease } from '../../src/composables/useLatestRelease'
import { RELEASE_FIXTURE, makeMockReturn } from './fixtures'

vi.mock('../../src/composables/useLatestRelease')
vi.mock('@sentry/vue', () => ({
  addBreadcrumb: vi.fn(),
  captureMessage: vi.fn(),
}))

const RELEASE = RELEASE_FIXTURE

function mockRelease(opts: Parameters<typeof makeMockReturn>[0] = {}) {
  vi.mocked(useLatestRelease).mockReturnValue(makeMockReturn(opts))
}

describe('DownloadSection', () => {
  beforeEach(() => {
    mockRelease()
  })

  it('version badge renders release.tag', () => {
    const wrapper = mount(DownloadSection)
    expect(wrapper.find('.version-badge').text()).toContain(RELEASE.tag)
  })

  it('stats show total, silicon, and intel download counts', () => {
    const wrapper = mount(DownloadSection)
    const stats = wrapper.find('.download-stats').text()
    expect(stats).toContain('100')
    expect(stats).toContain('80')
    expect(stats).toContain('20')
  })

  it('version badge has skeleton class while loading', () => {
    mockRelease({ loading: true, release: null })
    const wrapper = mount(DownloadSection)
    expect(wrapper.find('.version-badge').classes()).toContain('skeleton')
  })
})
