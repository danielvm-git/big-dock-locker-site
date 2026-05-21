# RELEASE-PLAN: Big DockLocker Marketing Website

**Goal:** Ship a polished, single-page Vue 3 + TypeScript + Vite marketing site for Big DockLocker that drives downloads from GitHub Releases. Download links and version badges are always live — they resolve from the GitHub Releases API at runtime so the site never needs a manual update when a new build ships. Releases are automated via semantic-release on every push to `main`.

**Success:** `npm run build` exits 0 with no TypeScript errors; every section is visible; download buttons resolve to the actual latest DMG assets from the GitHub API; site is fully responsive; a `git commit -m "feat: ..."` on main triggers a versioned GitHub Release automatically.

**Step count:** 19 steps across 11 stories.

---

### Story 0: Repository & Release Automation

**Context:** The site has no git repo yet and no CI. This story initialises the repo, wires semantic-release (already installed as devDependencies), and creates the GitHub Actions workflow that builds and releases on every push to `main`. Mirrors the config used in the app repo (`bigpowers-dock`) — same plugin chain, same branch model, minus the exec/DMG steps that only apply to the native app.

**Semantic-release plugins used:**
| Plugin | Role |
|---|---|
| `@semantic-release/commit-analyzer` | Reads Conventional Commits, decides version bump |
| `@semantic-release/release-notes-generator` | Generates changelog content |
| `@semantic-release/changelog` | Writes/updates `CHANGELOG.md` |
| `@semantic-release/git` | Commits `CHANGELOG.md` back to `main` |
| `@semantic-release/github` | Creates the GitHub Release with notes |

## Steps

1. Run `git init && git add . && git commit -m "chore: initial scaffold"` to initialise the repository → verify: `git log --oneline | head -3`

2. Create `.gitignore` with `node_modules/`, `dist/`, `.env*` → verify: `grep node_modules .gitignore && echo OK`

3. Create `.releaserc.json` with `branches: ["main"]` and the five-plugin chain (`commit-analyzer`, `release-notes-generator`, `changelog`, `git` committing `CHANGELOG.md`, `github`) — no npm publish since `"private": true` → verify: `node -e "require('./.releaserc.json')" && echo OK`

4. Create `.github/workflows/release.yml` — trigger: `push: branches: [main]`; steps: `actions/checkout@v4` (with `persist-credentials: false`), `actions/setup-node@v4` (node 24), `npm ci`, `npm run build`, `npx semantic-release`; env: `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` → verify: `cat .github/workflows/release.yml | grep -q "semantic-release" && echo OK`

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
**Response fields used:** `tag_name`, `assets[].name`, `assets[].browser_download_url`  
**Fallback URL:** `https://github.com/danielvm-git/big-dock-locker/releases/latest`

## Steps

10. Create `src/composables/useLatestRelease.ts` — module-scope `const release = ref<Release | null>(null)`, `const loading = ref(false)`, `const error = ref(false)`; exported `useLatestRelease()` guards with `if (release.value || loading.value) return { release, loading, error }`; on success populates `release.value`; on catch sets `error.value = true`; returns `{ release, loading, error }` as readonly → verify: `npm run build 2>&1 | grep -c error || true`

---

### Story 1.3: HeroSection component

**Context:** Full-viewport-height hero. Calls `useLatestRelease()`. Download buttons are disabled while loading and fall back to the GitHub releases page on error. Dashboard screenshot capped at `max-height: 480px` to prevent portrait overflow on small viewports.

## Steps

11. Create `src/components/HeroSection.vue` — `onMounted` calls composable, headline "Pin Your Dock. Keep It There.", sub-copy, two `<a>` download buttons bound to `release.value?.silicon / .intel` with fallback href to releases page, `aria-disabled` while loading, `<img src="/dashboard.png" alt="Big DockLocker dashboard" style="max-height:480px;width:auto">`, scoped responsive CSS → verify: `npm run build 2>&1 | grep -c error || true`

---

### Story 1.4: FeaturesSection component

**Context:** Five feature cards in a CSS grid (3 cols → 2 → 1). Icons are Unicode glyphs — no external icon library.

Features: Persistent Dock Pinning · Gesture Blocking · Menu Bar Integration · Native SwiftUI Dashboard · Launch at Login.

## Steps

12. Create `src/components/FeaturesSection.vue` — `features` typed as `{ icon: string; title: string; desc: string }[]`, CSS grid with responsive breakpoints, scoped CSS → verify: `npm run build 2>&1 | grep -c error || true`

---

### Story 1.5: HowItWorksSection component

**Context:** Three-step numbered flow (Download → Grant Permissions → Start Engine). Horizontal stepper on desktop, vertical stack on mobile (≤768px).

## Steps

13. Create `src/components/HowItWorksSection.vue` — `steps` typed as `{ num: number; title: string; body: string }[]`, horizontal flex with connector lines on desktop collapsing to vertical on mobile, scoped CSS → verify: `npm run build 2>&1 | grep -c error || true`

---

### Story 1.6: InstallSection component

**Context:** Gatekeeper bypass guide — required because the app is distributed outside the Mac App Store. Three subsections: Security approval, Accessibility permission, Terminal power-user shortcut. Terminal command rendered in `<code>` with a clipboard copy button (`navigator.clipboard.writeText`).

Terminal command: `xattr -dr com.apple.quarantine /Applications/BigDockLocker.app`

## Steps

14. Create `src/components/InstallSection.vue` — three numbered subsections, `<code>` block for terminal command, copy-to-clipboard button using `navigator.clipboard.writeText`, scoped CSS → verify: `npm run build 2>&1 | grep -c error || true`

---

### Story 1.7: DownloadSection component

**Context:** Primary below-the-fold conversion section. `id="download"` for the navbar anchor. Live version badge and macOS 13+ note. Calls `useLatestRelease()` — module-scope singleton, no second request. Skeleton opacity while loading.

## Steps

15. Create `src/components/DownloadSection.vue` — `id="download"`, calls `useLatestRelease()`, `release.value?.tag ?? '…'` as version badge, macOS 13+ note, two large download `<a>` buttons with Silicon/Intel labels and fallback href, `opacity: 0.5` skeleton while loading, scoped CSS → verify: `npm run build 2>&1 | grep -c error || true`

---

### Story 1.8: TheFooter component

**Context:** Minimal footer. GitHub link reuses `#github-icon` from the sprite. Version tag from the composable singleton (no extra fetch). Copyright.

## Steps

16. Create `src/components/TheFooter.vue` — GitHub `<a>` with `<use href="/icons.svg#github-icon">`, "MIT License", `release.value?.tag` (empty while loading), "© 2026 Daniel VM", scoped CSS → verify: `npm run build 2>&1 | grep -c error || true`

---

### Story 1.9: Wire App.vue and remove scaffold

**Context:** Swap HelloWorld for the seven new components. Delete HelloWorld.vue and the three unused asset files to satisfy `noUnusedLocals: true`.

## Steps

17. Rewrite `src/App.vue` — import and render in order: TheNavbar, HeroSection, FeaturesSection, HowItWorksSection, InstallSection, DownloadSection, TheFooter; no other imports → verify: `npm run build 2>&1 | grep -c error || true`

18. Delete `src/components/HelloWorld.vue`, `src/assets/hero.png`, `src/assets/vite.svg`, `src/assets/vue.svg` → verify: `npm run build 2>&1 | tail -3`

---

### Story 1.10: Final build and smoke-check

## Steps

19. Run full build, confirm zero TypeScript errors and zero Vite warnings → verify: `npm run build 2>&1 | tee /tmp/build.log; grep -iE "error|warn" /tmp/build.log || echo "CLEAN BUILD"`

20. Start preview server — visually confirm all seven sections render, navbar is sticky, download buttons are present → verify: `npm run preview -- --port 4173 &` then open `http://localhost:4173` (manual visual check)

---

## Out of scope

- Routing / multi-page navigation
- Blog, Privacy, Help, or Privacy pages
- Analytics integration
- Contact form
- Automated visual regression tests
- Deployment target configuration (Netlify / Vercel / Pages — add after this plan)

## Risks

- `noUnusedLocals: true` — every `<script setup>` variable must appear in the template.
- `useLatestRelease` race guard: if two components mount simultaneously before the first fetch resolves, `if (release.value || loading.value) return` prevents a duplicate request.
- Dashboard screenshot is portrait (892×1058) — hero must cap `max-height: 480px`.
- GitHub unauthenticated API rate limit: 60 req/hour per IP. All three composable callers share one request via module-scope state.
- Error fallback: if the API fails, download buttons must still link to the GitHub releases page.
- `GITHUB_TOKEN` is automatically provided by GitHub Actions for public repos — no manual secret needed for the release workflow.
