import { mount } from '@vue/test-utils'
import InstallSection from '../../src/components/InstallSection.vue'

const COMMAND = 'xattr -dr com.apple.quarantine /Applications/BigDockLocker.app'

describe('InstallSection', () => {
  let writeText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('copy button calls navigator.clipboard.writeText with the exact terminal command', async () => {
    const wrapper = mount(InstallSection)
    await wrapper.find('.copy-btn').trigger('click')
    expect(writeText).toHaveBeenCalledWith(COMMAND)
  })
})
