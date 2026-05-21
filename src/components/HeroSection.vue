<script setup lang="ts">
import * as Sentry from '@sentry/vue'
import { useLatestRelease } from '../composables/useLatestRelease'

const FALLBACK = 'https://github.com/danielvm-git/big-dock-locker/releases/latest'
const { release, loading, error, incrementDownload } = useLatestRelease()

function trackDownload(arch: 'apple-silicon' | 'intel') {
  incrementDownload(arch)
  Sentry.addBreadcrumb({
    category: 'download',
    message: `download_clicked`,
    level: 'info',
    data: { arch, version: release.value?.tag ?? 'unknown', source: 'hero' },
  })
  Sentry.captureMessage(`download_clicked:${arch}`, {
    level: 'info',
    tags: { arch, version: release.value?.tag ?? 'unknown', source: 'hero' },
  })
}
</script>

<template>
  <section class="hero section">
    <div class="site-container hero-inner">
      <div class="hero-copy">
        <p class="section-label">Free &amp; Open Source · macOS 13+</p>
        <h1 class="hero-headline">Pin Your Dock.<br />Keep It There.</h1>
        <p class="hero-sub">
          Big DockLocker stops your Mac Dock from jumping to another display when
          your mouse grazes the screen edge. One click — always on the right monitor.
        </p>
        <div class="hero-actions">
          <a
            :href="error ? FALLBACK : (release?.silicon ?? FALLBACK)"
            :aria-disabled="loading ? 'true' : undefined"
            class="btn-primary"
            @click="trackDownload('apple-silicon')"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
              <path d="M18.71 7.21l-1.42-1.42L12 11.09 6.71 5.79 5.29 7.21l5.3 5.29-5.3 5.29 1.42 1.42L12 13.91l5.29 5.3 1.42-1.42-5.3-5.29 5.3-5.29z" />
            </svg>
            {{ loading ? 'Loading…' : 'Apple Silicon' }}
          </a>
          <a
            :href="error ? FALLBACK : (release?.intel ?? FALLBACK)"
            :aria-disabled="loading ? 'true' : undefined"
            class="btn-secondary"
            @click="trackDownload('intel')"
          >
            {{ loading ? 'Loading…' : 'Intel Mac' }}
          </a>
        </div>
        <p v-if="release?.downloads.total" class="hero-downloads">
          ↓ {{ release.downloads.total.toLocaleString() }} downloads
        </p>

        <p v-if="error" class="hero-error">
          Could not fetch release info.
          <a :href="FALLBACK" target="_blank" rel="noopener noreferrer">Go to releases →</a>
        </p>
      </div>
      <div class="hero-screenshot">
        <img
          src="/dashboard.png"
          alt="Big DockLocker dashboard"
          class="hero-img"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  background: linear-gradient(160deg, var(--accent-bg) 0%, var(--bg) 60%);
  border-bottom: 1px solid var(--border);
}

.hero-inner {
  display: flex;
  align-items: center;
  gap: 64px;
  padding-top: 80px;
  padding-bottom: 80px;

  @media (max-width: 900px) {
    flex-direction: column;
    gap: 48px;
    text-align: center;
    padding-top: 56px;
    padding-bottom: 56px;
  }
}

.hero-copy {
  flex: 1;
  min-width: 0;
}

.hero-headline {
  margin: 12px 0 20px;
}

.hero-sub {
  font-size: 19px;
  color: var(--text);
  max-width: 500px;
  margin-bottom: 36px;
  line-height: 1.65;

  @media (max-width: 900px) {
    font-size: 17px;
    margin: 0 auto 36px;
  }
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;

  @media (max-width: 900px) {
    justify-content: center;
  }
}

.hero-downloads {
  margin-top: 14px;
  font-size: 13px;
  color: var(--text);
  font-weight: 500;
}

.hero-error {
  margin-top: 16px;
  font-size: 14px;
  color: var(--text);

  a {
    color: var(--accent);
    text-decoration: none;
  }
}

.hero-screenshot {
  flex: 0 0 auto;

  @media (max-width: 900px) {
    width: 100%;
    display: flex;
    justify-content: center;
  }
}

.hero-img {
  max-height: 480px;
  width: auto;
  max-width: 100%;
  border-radius: 16px;
  box-shadow: var(--shadow), 0 32px 64px rgba(0, 0, 0, 0.12);
}
</style>
