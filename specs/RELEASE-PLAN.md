# RELEASE-PLAN: Big DockLocker Marketing Website

**Goal:** Ship a polished, single-page Vue 3 + TypeScript + Vite marketing site for Big DockLocker that drives downloads from GitHub Releases. Download links and version badges are always live — they resolve from the GitHub Releases API at runtime so the site never needs a manual update when a new build ships. Releases are automated via big-release on every push to `main`.

**Success:** `npm run build` exits 0 with no TypeScript errors; every section is visible; download buttons resolve to the actual latest DMG assets from the GitHub API; site is fully responsive; a `git commit -m "feat: ..."` on main triggers a versioned GitHub Release automatically.

**Step count:** 19 steps across 11 stories.

---

### Story 0: Repository & Release Automation

**Context:** The site initialises release automation using `big-release` via `.big-release.yml` and creates the GitHub Actions workflow that builds and releases on every push to `main`.

**Big-release plugins used:**

| Plugin      | Role                                  |
| ----------- | ------------------------------------- |
| `changelog` | Writes/updates `CHANGELOG.md`         |
| `git`       | Commits `CHANGELOG.md` back to `main` |
| `github`    | Creates the GitHub Release with notes |

## Steps

1. Run `git init && git add . && git commit -m "chore: initial scaffold"` to initialise the repository → verify: `git log --oneline | head -3`

2. Create `.gitignore` with `node_modules/`, `dist/`, `.env*` → verify: `grep node_modules .gitignore && echo OK`

3. Create `.big-release.yml` with `branches: ["main"]` and plugin chain (`changelog`, `git` committing `CHANGELOG.md`, `github`) → verify: `test -f .big-release.yml && echo OK`

4. Create `.github/workflows/release.yml` — trigger: `push: branches: [main]`; steps: `actions/checkout@v4`, `actions/setup-node@v4` (node 24), `npm ci`, `npm run build`, install `big-release`, run `big-release`; env: `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` → verify: `cat .github/workflows/release.yml | grep -q "big-release" && echo OK`

---

### Story 1.0: Static Assets

**Context:** The app icon (2048×2048 PNG) and dashboard screenshot (892×1058 PNG) live in the source app repo and must be served as static files by Vite. Copying them to `public/` makes them available at `/` without import resolution.

## Steps

5. Copy `AppIcon.png` from `/Users/danielvm/Developer/bigpowers-dock/Assets/` to `public/icon.png` → verify: `ls -lh public/icon.png`

6. Copy `dashboard.png` from `/Users/danielvm/Developer/bigpowers-dock/Assets/` to `public/dashboard.png` → verify: `ls -lh public/dashboard.png`

7. Update `index.html`: set title to `Big DockLocker — Pin Your Dock. Keep It There.`, add `<meta name="description">`, switch favicon to `<link rel="icon" type="image/png" href="/icon.png">` → verify: `grep -q "Big DockLocker" index.html && echo OK`

---

### Story 1.1: Global Styles

**Context:** The existing `style.css` has correct CSS variable definitions (light + dark) but carries Vite scaffold classes (`.hero`, `.counter`, `#center`, `#next-steps`, `#docs`, `#spacer`, `.ticks`) that are dead weight for a marketing site. The `#app` rule constrains width at the wrapper level — for full-bleed section backgrounds, max-width must live on inner content containers instead. This step rewrites `style.css`: keeps all variable blocks and base resets, removes scaffold classes, restructures `#app` to be full-width, adds `.site-container`, `.btn-primary`, `.btn-secondary`, and section layout tokens.

## Steps

8. Rewrite `src/style.css` — preserve `:root` variable blocks verbatim, keep `body`/`h1`/`h2`/`p`/`code` base rules, remove all scaffold classes, restructure `#app` to `min-height: 100svh; display: flex; flex-direction: column` (no fixed width), add `.site-container` (max-width 1100px, centered, horizontal padding), `.btn-primary`, `.btn-secondary` → verify: `npm run build 2>&1 | tail -5`

---

### Story 1.2: TheNavbar component

**Context:** Sticky top nav. Logo (app icon + "Big DockLocker" wordmark) on the left. GitHub link using the existing `#github-icon` from `public/icons.svg` + "Download" CTA anchor on the right. All links are `href="#section-id"` scroll anchors.

## Steps

9. Create `src/components/TheNavbar.vue` — sticky nav, `<img src="/icon.png" alt="">` + "Big DockLocker" text left, `<a href="https://github.com/danielvm-git/big-dock-locker">` with `<use href="/icons.svg#github-icon">` + "Download" button linking to `#download`, scoped CSS → verify: `npm run build 2>&1 | grep -c error || true`

---

### Story 1.2b: useLatestRelease composable

**Context:** HeroSection, DownloadSection, and TheFooter all need the same live release data. State is declared at **module scope** so all callers share a single reactive object and only one `fetch` ever fires regardless of how many components mount.

**API:** `GET https://api.github.com/repos/danielvm-git/big-dock-locker/releases/latest`  
**Response fields used:** `tag_name`, `assets[].name`, `assets[].browser_download_url`, `assets[].download_count`  
**Fallback URL:** `https://github.com/danielvm-git/big-dock-locker/releases/latest`

## Steps

10. Create `src/composables/useLatestRelease.ts` — module-scope `const release = ref<Release | null>(null)`, `const loading = ref(false)`, `const error = ref(false)`; exported `useLatestRelease()` guards with singleton check; on success populates `release.value` with tag, silicon URL, intel URL, and downloads breakdown; on catch sets `error.value = true`; exports `incrementDownload(arch)` for optimistic UI; `visibilitychange` listener triggers refetch when tab regains focus; returns `{ release, loading, error, incrementDownload }` → verify: `npm run build 2>&1 | grep -c error || true`

---

### Story 1.3: HeroSection component

**Context:** Full-viewport-height hero. Calls `useLatestRelease()`. Download buttons are disabled while loading and fall back to the GitHub releases page on error. Dashboard screenshot capped at `max-height: 480px` to prevent portrait overflow on small viewports.

## Steps

11. Create `src/components/HeroSection.vue` → verify: `npm run build 2>&1 | grep -c error || true`

---

### Story 1.4: FeaturesSection component

## Steps

12. Create `src/components/FeaturesSection.vue` → verify: `npm run build 2>&1 | grep -c error || true`

---

### Story 1.5: HowItWorksSection component

## Steps

13. Create `src/components/HowItWorksSection.vue` → verify: `npm run build 2>&1 | grep -c error || true`

---

### Story 1.6: InstallSection component

## Steps

14. Create `src/components/InstallSection.vue` → verify: `npm run build 2>&1 | grep -c error || true`

---

### Story 1.7: DownloadSection component

## Steps

15. Create `src/components/DownloadSection.vue` → verify: `npm run build 2>&1 | grep -c error || true`

---

### Story 1.8: TheFooter component

## Steps

16. Create `src/components/TheFooter.vue` → verify: `npm run build 2>&1 | grep -c error || true`

---

### Story 1.9: Wire App.vue and remove scaffold

## Steps

17. Rewrite `src/App.vue` → verify: `npm run build 2>&1 | grep -c error || true`

18. Delete scaffold files → verify: `npm run build 2>&1 | tail -3`

---

### Story 1.10: Final build and smoke-check

## Steps

19. Run full build → verify: `npm run build 2>&1 | tee /tmp/build.log; grep -iE "error|warn" /tmp/build.log || echo "CLEAN BUILD"`

20. Start preview server → verify: `npm run preview -- --port 4173 &` then open `http://localhost:4173`

---

### Story 2.0: Vitest + @vue/test-utils setup

**Context:** Install and configure the unit/component test runner. Vitest is chosen for native Vite integration — no separate bundler pass. Tests live in `tests/unit/` at the project root (not inside `src/`) to avoid being caught by `tsconfig.app.json`'s `noUnusedLocals` check, which `vue-tsc -b` enforces only over `src/**`. A dedicated `vitest.config.ts` keeps test configuration separate from the production Vite config (which runs the Sentry plugin and sourcemap build).

**Reason for separate vitest.config.ts:** The production `vite.config.ts` runs `sentryVitePlugin` on every build, which emits warnings without `SENTRY_AUTH_TOKEN`. Test runs must not trigger the Sentry plugin at all.

## Steps

21. Install `vitest`, `@vue/test-utils`, `@vitejs/plugin-vue`, `jsdom` as devDependencies → verify: `node -e "require('./node_modules/vitest/package.json')" && echo OK`

22. Create `vitest.config.ts` — extends vue plugin, sets `environment: 'jsdom'`, `globals: true`, `include: ['tests/unit/**/*.test.ts']`, excludes Sentry plugin → verify: `cat vitest.config.ts | grep -q jsdom && echo OK`

23. Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts to `package.json` → verify: `npm run test 2>&1 | grep -q "no test files" && echo OK || npm run test`

24. Create `tests/unit/` directory with a placeholder `tests/unit/.gitkeep` and confirm Vitest finds it → verify: `npm run test 2>&1 | tail -5`

---

### Story 2.1: Unit tests — useLatestRelease composable

**Context:** The composable uses module-scope singleton refs. Each test must call `vi.resetModules()` and re-import the module dynamically to get fresh state. `fetch` is mocked with `vi.stubGlobal`. The `visibilitychange` listener is tested by dispatching a synthetic event via `document.dispatchEvent`.

**Contracts that must hold:**

- First call fetches; second call (same module instance) skips fetch
- Silicon asset identified by `name.includes('apple-silicon')`
- Intel asset identified by `name.includes('intel')`
- `downloads.total === downloads.silicon + downloads.intel`
- On network error: `error.value === true`, `release.value === null`
- `incrementDownload('apple-silicon')` increments silicon and total by 1, intel unchanged
- `incrementDownload('intel')` increments intel and total by 1, silicon unchanged

## Steps

25. Create `tests/unit/useLatestRelease.test.ts` with a `mockFetch` helper that returns a well-formed GitHub API response fixture; write test: "fetches from the correct GitHub API URL on first call" → verify: `npm run test -- --reporter=verbose 2>&1 | grep -q "fetches from" && echo OK`

26. Add test: "does not fetch twice when called again with release already loaded (singleton guard)" — asserts `fetch` call count is 1 after two `useLatestRelease()` calls → verify: `npm run test -- --reporter=verbose 2>&1 | grep -q "singleton" && echo OK`

27. Add test: "parses silicon and intel download URLs from assets array" — asserts `release.value.silicon` contains `apple-silicon` and `release.value.intel` contains `intel` → verify: `npm run test -- --reporter=verbose 2>&1 | grep -q "parses silicon" && echo OK`

28. Add test: "extracts download_count for each arch and computes correct total" — fixture has silicon: 80, intel: 20, asserts total: 100 → verify: `npm run test -- --reporter=verbose 2>&1 | grep -q "download_count" && echo OK`

29. Add test: "sets error=true and leaves release=null when fetch rejects" → verify: `npm run test -- --reporter=verbose 2>&1 | grep -q "error=true" && echo OK`

30. Add test: "incrementDownload('apple-silicon') adds 1 to silicon and total, leaves intel unchanged" → verify: `npm run test -- --reporter=verbose 2>&1 | grep -q "incrementDownload" && echo OK`

31. Add test: "incrementDownload('intel') adds 1 to intel and total, leaves silicon unchanged" → verify: `npm run test -- --reporter=verbose 2>&1 | grep -q "incrementDownload.*intel" && echo OK`

32. Add test: "visibilitychange refetches when document becomes visible and release is already loaded" — dispatches `visibilitychange` after first fetch, asserts fetch called twice → verify: `npm run test -- --reporter=verbose 2>&1 | grep -q "visibilitychange" && echo OK`

33. Run full unit suite and confirm all 8 composable tests pass → verify: `npm run test 2>&1 | grep -E "8 passed|Tests.*8"`

---

### Story 2.2: Component tests — HeroSection

**Context:** Component tests mount the component with `@vue/test-utils` and stub `useLatestRelease` via `vi.mock`. `@sentry/vue` is also mocked to prevent real Sentry calls. Tests assert rendered HTML, not implementation details.

**Reason for vi.mock on useLatestRelease:** The composable fetches on import; stubbing it keeps component tests hermetic and fast.

## Steps

34. Create `tests/unit/HeroSection.test.ts` — mock `useLatestRelease` to return a loaded release fixture; assert two `<a>` download buttons are rendered → verify: `npm run test -- --reporter=verbose 2>&1 | grep -q "HeroSection" && echo OK`

35. Add test: "download button hrefs match release.silicon and release.intel" — asserts `href` attribute values → verify: `npm run test 2>&1 | grep -E "passed"`

36. Add test: "buttons carry aria-disabled='true' while loading" — mock returns `loading: true, release: null` → verify: `npm run test 2>&1 | grep -E "passed"`

37. Add test: "shows fallback link when error is true" — mock returns `error: true` → verify: `npm run test 2>&1 | grep -E "passed"`

38. Add test: "shows download total when release is loaded" — asserts text contains the formatted total number → verify: `npm run test 2>&1 | grep -E "passed"`

---

### Story 2.3: Component tests — DownloadSection, TheNavbar, InstallSection

**Context:** Remaining component tests. `navigator.clipboard` is stubbed via `vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })` before mounting InstallSection.

## Steps

39. Create `tests/unit/DownloadSection.test.ts` — assert version badge renders `release.tag`; assert stats show total/silicon/intel counts; assert skeleton class present while loading → verify: `npm run test 2>&1 | grep -E "passed"`

40. Create `tests/unit/TheNavbar.test.ts` — assert Download CTA has `href="#download"`; assert GitHub link has correct `href` → verify: `npm run test 2>&1 | grep -E "passed"`

41. Create `tests/unit/InstallSection.test.ts` — stub `navigator.clipboard.writeText`; click copy button; assert `writeText` called with the exact terminal command string → verify: `npm run test 2>&1 | grep -E "passed"`

42. Run full unit suite and confirm all component tests pass alongside composable tests → verify: `npm run test 2>&1 | grep -E "passed" | tail -3`

---

### Story 2.4: Playwright E2E setup and smoke tests

**Context:** Playwright runs against the Vite preview server (`npm run preview`). Tests verify that the full page renders correctly in a real browser (headless Chromium). The `webServer` config in `playwright.config.ts` auto-starts the preview server before the test run.

**Reason for Playwright over Vitest browser mode:** Playwright provides stable cross-browser support and a mature API for anchor navigation and network mocking — the key E2E concerns for this SPA.

## Steps

43. Install `@playwright/test` and run `npx playwright install chromium` → verify: `npx playwright --version && echo OK`

44. Create `playwright.config.ts` — `testDir: 'tests/e2e'`, `webServer: { command: 'npm run preview -- --port 4174', url: 'http://localhost:4174', reuseExistingServer: true }`, project: `chromium` only → verify: `cat playwright.config.ts | grep -q "chromium" && echo OK`

45. Add `"test:e2e": "playwright test"` script to `package.json` → verify: `cat package.json | grep -q "test:e2e" && echo OK`

46. Create `tests/e2e/smoke.test.ts` — test: "page title is correct" asserts `<title>` contains "Big DockLocker" → verify: `npm run build && npm run test:e2e 2>&1 | grep -q "passed"`

47. Add E2E test: "all seven sections are visible" — checks `#features`, `#how-it-works`, `#install`, `#download` exist in DOM → verify: `npm run test:e2e 2>&1 | grep -q "passed"`

48. Add E2E test: "navbar Download button scrolls to #download section" — clicks `.navbar-cta`, asserts `#download` is in viewport → verify: `npm run test:e2e 2>&1 | grep -q "passed"`

49. Add E2E test: "download buttons have valid href attributes" — asserts both Apple Silicon and Intel `<a>` tags have `href` starting with `https://` (mocks GitHub API response via `page.route`) → verify: `npm run test:e2e 2>&1 | grep -q "passed"`

50. Run full E2E suite and confirm all tests pass → verify: `npm run test:e2e 2>&1 | grep -E "passed" | tail -3`

---

### Story 2.5: Wire tests into CI before build

**Context:** Tests must be a hard gate before the build step in `.github/workflows/release.yml`. Unit tests run against source (no build needed). E2E runs after build against the preview server. Both must be green for the release to proceed.

## Steps

51. Update `.github/workflows/release.yml` — insert `npm run test` step between `npm ci` and `npm run build`; add a separate `npm run test:e2e` step after `npm run build` but before `npx semantic-release`; add `npx playwright install --with-deps chromium` before the E2E step → verify: `cat .github/workflows/release.yml | grep -A2 "npm run test" | head -10`

52. Commit all test files and CI changes → verify: `git status --short | grep -c "^A " && echo "files staged"`

53. Run the full local pipeline in sequence to confirm end-to-end green: unit tests → build → E2E → verify: `npm run test && npm run build && npm run test:e2e && echo "PIPELINE GREEN"`

---

## Out of scope

- Snapshot testing / visual regression
- Accessibility (a11y) automated checks
- Load / performance tests
- Testing FeaturesSection, HowItWorksSection, TheFooter (pure static markup, no logic)
- Cross-browser E2E beyond Chromium (add Firefox/WebKit later)

## Risks

- **Singleton reset between unit tests:** `vi.resetModules()` must be called in `beforeEach` and the composable re-imported dynamically — if forgotten, state bleeds between tests and order-dependence breaks the suite.
- **jsdom missing browser APIs:** `navigator.clipboard`, `document.visibilityState` may not be available — stub explicitly before each test that needs them.
- **Preview server port conflict in E2E:** if port 4174 is in use locally, Playwright will hang — `reuseExistingServer: true` mitigates this in CI; locally use `--port 0` if needed.
- **GitHub API mocking in E2E:** `page.route('**/api.github.com/**', ...)` must intercept before page load — if the route handler is registered after navigation, the real API call fires and tests become network-dependent.
- **`noUnusedLocals` in test files:** test files in `tests/` are outside `tsconfig.app.json` scope so `vue-tsc -b` won't flag them — but Vitest uses esbuild for transpilation so TS errors in test files are not caught at build time. Add a `tsconfig.test.json` if strict type-checking of tests is desired (out of scope for this plan).
