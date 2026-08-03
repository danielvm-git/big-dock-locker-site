import { mount } from '@vue/test-utils'
import TheNavbar from '../../src/components/TheNavbar.vue'

describe('TheNavbar', () => {
  it('Download CTA has href="#download"', () => {
    const wrapper = mount(TheNavbar)
    expect(wrapper.find('.navbar-cta').attributes('href')).toBe('#download')
  })

  it('GitHub link has the correct repository href', () => {
    const wrapper = mount(TheNavbar)
    expect(wrapper.find('.navbar-gh').attributes('href')).toBe(
      'https://github.com/danielvm-git/big-dock-locker',
    )
  })
})
