import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import InstallSection from '../../src/components/InstallSection.vue'

const COMMAND = 'xattr -dr com.apple.quarantine /Applications/BigDockLocker.app'

async function clickCopy(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('.copy-btn').trigger('click')
  await flushPromises()
}

describe('InstallSection', () => {
  let writeText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('copy button calls navigator.clipboard.writeText with the exact terminal command', async () => {
    const wrapper = mount(InstallSection)
    await clickCopy(wrapper)
    expect(writeText).toHaveBeenCalledWith(COMMAND)
  })

  it('shows the copied label and class after writeText resolves', async () => {
    const wrapper = mount(InstallSection)
    await clickCopy(wrapper)

    const button = wrapper.find('.copy-btn')
    expect(button.classes()).toContain('copied')
    expect(button.text()).toContain('Copied')
    expect(button.attributes('aria-label')).toBe('Copied!')
  })

  it('returns to idle after the 2 s confirmation window', async () => {
    const wrapper = mount(InstallSection)
    await clickCopy(wrapper)
    expect(wrapper.find('.copy-btn').classes()).toContain('copied')

    vi.advanceTimersByTime(2000)
    await nextTick()

    const button = wrapper.find('.copy-btn')
    expect(button.classes()).not.toContain('copied')
    expect(button.text()).toBe('Copy')
    expect(button.attributes('aria-label')).toBe('Copy command')
  })

  it('a second click cancels the first timer so the confirmation does not disappear early', async () => {
    const wrapper = mount(InstallSection)
    await clickCopy(wrapper)
    expect(wrapper.find('.copy-btn').classes()).toContain('copied')

    vi.advanceTimersByTime(1500)
    await clickCopy(wrapper)
    expect(wrapper.find('.copy-btn').classes()).toContain('copied')

    vi.advanceTimersByTime(1000)
    await nextTick()

    expect(wrapper.find('.copy-btn').classes()).toContain('copied')
  })

  it('guards a second click while a copy is in flight', async () => {
    let resolveCopy!: () => void
    writeText.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveCopy = resolve
        }),
    )

    const wrapper = mount(InstallSection)
    await wrapper.find('.copy-btn').trigger('click')
    expect(wrapper.find('.copy-btn').attributes('disabled')).toBeDefined()

    await wrapper.find('.copy-btn').trigger('click')
    expect(writeText).toHaveBeenCalledTimes(1)

    resolveCopy()
    await flushPromises()
    expect(wrapper.find('.copy-btn').classes()).toContain('copied')
  })

  it('enters copy-error on rejection without an unhandled rejection', async () => {
    const unhandled: unknown[] = []
    const onUnhandled = (reason: unknown) => unhandled.push(reason)
    process.on('unhandledRejection', onUnhandled)

    try {
      writeText.mockRejectedValueOnce(new Error('clipboard denied'))
      const wrapper = mount(InstallSection)
      await clickCopy(wrapper)
      await vi.advanceTimersByTimeAsync(0)

      const button = wrapper.find('.copy-btn')
      expect(button.classes()).not.toContain('copied')
      expect(button.text()).toContain('Copy failed')
      expect(button.attributes('aria-label')).toBe('Copy failed. Try again.')
      expect(wrapper.find('[role="alert"]').text()).toBe('Copy failed')
      expect(unhandled).toHaveLength(0)
    } finally {
      process.off('unhandledRejection', onUnhandled)
    }
  })

  it('clears the reset timer on unmount', async () => {
    const wrapper = mount(InstallSection)
    await clickCopy(wrapper)
    expect(vi.getTimerCount()).toBe(1)

    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)

    vi.advanceTimersByTime(2000)
    await nextTick()
  })
})
