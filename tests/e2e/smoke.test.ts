import { test, expect } from '@playwright/test'

const GITHUB_API_GLOB = '**/api.github.com/**'

const API_FIXTURE = {
  tag_name: 'v1.3.0',
  assets: [
    {
      name: 'big-dock-locker-apple-silicon.dmg',
      browser_download_url:
        'https://github.com/danielvm-git/big-dock-locker/releases/download/v1.3.0/big-dock-locker-apple-silicon.dmg',
      download_count: 80,
    },
    {
      name: 'big-dock-locker-intel.dmg',
      browser_download_url:
        'https://github.com/danielvm-git/big-dock-locker/releases/download/v1.3.0/big-dock-locker-intel.dmg',
      download_count: 20,
    },
  ],
}

test.beforeEach(async ({ page }) => {
  await page.route(GITHUB_API_GLOB, (route) => route.fulfill({ json: API_FIXTURE }))
})

test('page title is correct', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Big DockLocker/)
})

test('all four sections are visible', async ({ page }) => {
  await page.goto('/')
  for (const id of ['features', 'how-it-works', 'install', 'download']) {
    await expect(page.locator(`#${id}`)).toBeVisible()
  }
})

test('navbar Download button links to #download section', async ({ page }) => {
  await page.goto('/')
  const cta = page.locator('.navbar-cta')
  await expect(cta).toHaveAttribute('href', '#download')
})

test('download buttons have valid https:// href attributes', async ({ page }) => {
  await page.goto('/')
  await page.waitForSelector('.hero-actions a[href^="https://"]')
  const links = page.locator('.hero-actions a')
  const count = await links.count()
  expect(count).toBe(2)
  for (let i = 0; i < count; i++) {
    const href = await links.nth(i).getAttribute('href')
    expect(href).toMatch(/^https:\/\//)
  }
})
