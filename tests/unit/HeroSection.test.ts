import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import HeroSection from '../../src/components/HeroSection.vue'
import { useLatestRelease } from '../../src/composables/useLatestRelease'

vi.mock('../../src/composables/useLatestRelease')
vi.mock('@sentry/vue', () => ({
  addBreadcrumb: vi.fn(),
  captureMessage: vi.fn(),
}))

const FALLBACK = 'https://github.com/danielvm-git/big-dock-locker/releases/latest'

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

describe('HeroSection', () => {
  beforeEach(() => {
    mockRelease()
  })

  it('renders two download buttons', () => {
    const wrapper = mount(HeroSection)
    expect(wrapper.findAll('.hero-actions a')).toHaveLength(2)
  })

  it('download button hrefs match release.silicon and release.intel', () => {
    const wrapper = mount(HeroSection)
    const links = wrapper.findAll('.hero-actions a')
    expect(links[0].attributes('href')).toBe(RELEASE.silicon)
    expect(links[1].attributes('href')).toBe(RELEASE.intel)
  })

  it("buttons carry aria-disabled='true' while loading", () => {
    mockRelease({ loading: true, release: null })
    const wrapper = mount(HeroSection)
    wrapper
      .findAll('.hero-actions a')
      .forEach((link) => expect(link.attributes('aria-disabled')).toBe('true'))
  })

  it('shows fallback link when error is true', () => {
    mockRelease({ error: true, release: null })
    const wrapper = mount(HeroSection)
    const errorEl = wrapper.find('.hero-error')
    expect(errorEl.exists()).toBe(true)
    expect(errorEl.find('a').attributes('href')).toBe(FALLBACK)
  })

  it('shows download total when release is loaded', () => {
    const wrapper = mount(HeroSection)
    const dl = wrapper.find('.hero-downloads')
    expect(dl.exists()).toBe(true)
    expect(dl.text()).toContain('100')
  })
})
