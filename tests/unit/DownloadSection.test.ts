import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import DownloadSection from '../../src/components/DownloadSection.vue'
import { useLatestRelease } from '../../src/composables/useLatestRelease'

vi.mock('../../src/composables/useLatestRelease')
vi.mock('@sentry/vue', () => ({
  addBreadcrumb: vi.fn(),
  captureMessage: vi.fn(),
}))

const RELEASE = {
  tag: 'v1.3.0',
  silicon: 'https://example.com/v1.3.0/apple-silicon.dmg',
  intel: 'https://example.com/v1.3.0/intel.dmg',
  downloads: { silicon: 80, intel: 20, total: 100 },
}

function mockRelease(opts: { loading?: boolean; error?: boolean; release?: typeof RELEASE | null } = {}) {
  vi.mocked(useLatestRelease).mockReturnValue({
    release: ref(opts.release !== undefined ? opts.release : RELEASE) as any,
    loading: ref(opts.loading ?? false),
    error: ref(opts.error ?? false),
    incrementDownload: vi.fn(),
  })
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
