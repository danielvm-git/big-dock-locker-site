<script setup lang="ts">
import * as Sentry from '@sentry/vue'
import { useLatestRelease } from '../composables/useLatestRelease'

const FALLBACK = 'https://github.com/danielvm-git/big-dock-locker/releases/latest'
const { release, loading, error } = useLatestRelease()

function trackDownload(arch: 'apple-silicon' | 'intel') {
  Sentry.addBreadcrumb({
    category: 'download',
    message: `download_clicked`,
    level: 'info',
    data: { arch, version: release.value?.tag ?? 'unknown', source: 'download-section' },
  })
  Sentry.captureMessage(`download_clicked:${arch}`, {
    level: 'info',
    tags: { arch, version: release.value?.tag ?? 'unknown', source: 'download-section' },
  })
}
</script>

<template>
  <section id="download" class="section download">
    <div class="site-container download-inner">
      <p class="section-label">Download</p>
      <h2 class="section-title">Free. Open-source. Always.</h2>
      <p class="section-sub">
        Big DockLocker is MIT-licensed and free forever.
        Pick the build that matches your Mac.
      </p>

      <div class="version-badge" :class="{ skeleton: loading }">
        {{ release?.tag ?? (loading ? '' : 'Latest') }}
        <span class="req">· macOS 13+</span>
      </div>

      <div class="download-buttons">
        <a
          :href="error ? FALLBACK : (release?.silicon ?? FALLBACK)"
          :aria-disabled="loading ? 'true' : undefined"
          class="btn-primary download-btn"
          @click="trackDownload('apple-silicon')"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17 12l-5 5-5-5 1.41-1.41L11 13.17V6h2v7.17l2.59-2.58L17 12zm-5 7a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-16C6.48 3 2 7.48 2 13s4.48 10 10 10 10-4.48 10-10S17.52 3 12 3z" />
          </svg>
          {{ loading ? 'Loading…' : 'Apple Silicon (M1–M4)' }}
        </a>
        <a
          :href="error ? FALLBACK : (release?.intel ?? FALLBACK)"
          :aria-disabled="loading ? 'true' : undefined"
          class="btn-secondary download-btn"
          @click="trackDownload('intel')"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17 12l-5 5-5-5 1.41-1.41L11 13.17V6h2v7.17l2.59-2.58L17 12zm-5 7a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-16C6.48 3 2 7.48 2 13s4.48 10 10 10 10-4.48 10-10S17.52 3 12 3z" />
          </svg>
          {{ loading ? 'Loading…' : 'Intel Mac' }}
        </a>
      </div>

      <div v-if="release?.downloads.total" class="download-stats">
        <span class="stat-item">
          <strong>{{ release.downloads.total.toLocaleString() }}</strong> total downloads
        </span>
        <span class="stat-sep">·</span>
        <span class="stat-item">
          <strong>{{ release.downloads.silicon.toLocaleString() }}</strong> Apple Silicon
        </span>
        <span class="stat-sep">·</span>
        <span class="stat-item">
          <strong>{{ release.downloads.intel.toLocaleString() }}</strong> Intel
        </span>
      </div>

      <p v-if="error" class="download-error">
        Could not load release info.
        <a :href="FALLBACK" target="_blank" rel="noopener noreferrer">
          View all releases on GitHub →
        </a>
      </p>

      <p class="download-note">
        New to Big DockLocker?
        <a href="#install">Read the installation guide</a> to get past Gatekeeper in 60 seconds.
      </p>
    </div>
  </section>
</template>

<style scoped>
.download {
  background: linear-gradient(160deg, var(--accent-bg) 0%, var(--bg) 80%);
  border-top: 1px solid var(--border);
  text-align: center;
}

.download-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.version-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 24px 0 36px;
  padding: 6px 16px;
  border-radius: 99px;
  background: var(--accent-bg);
  border: 1px solid var(--accent-border);
  color: var(--accent);
  font-size: 14px;
  font-weight: 700;
  font-family: var(--mono);
  min-width: 120px;
  min-height: 32px;
  transition: opacity 0.3s;

  &.skeleton {
    opacity: 0.4;
  }
}

.req {
  font-weight: 400;
  color: var(--text);
  font-family: var(--sans);
}

.download-buttons {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.download-btn {
  font-size: 17px;
  padding: 16px 32px;
}

.download-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  font-size: 14px;
  color: var(--text);
  flex-wrap: wrap;
  justify-content: center;

  strong {
    color: var(--text-h);
  }
}

.stat-sep {
  color: var(--border);
}

.download-error {
  margin-top: 20px;
  font-size: 14px;
  color: var(--text);

  a {
    color: var(--accent);
    text-decoration: none;
  }
}

.download-note {
  margin-top: 28px;
  font-size: 14px;
  color: var(--text);

  a {
    color: var(--accent);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
