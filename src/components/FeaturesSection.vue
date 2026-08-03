<script setup lang="ts">
interface Feature {
  icon: string
  title: string
  desc: string
}

const features: Feature[] = [
  {
    icon: '📌',
    title: 'Persistent Dock Pinning',
    desc: 'Choose which monitor holds your Dock and keep it there permanently — across reboots and display reconnections.',
  },
  {
    icon: '🛡️',
    title: 'Gesture Blocking',
    desc: 'Actively intercepts bottom-edge mouse events on non-primary displays so the Dock never gets stolen.',
  },
  {
    icon: '☰',
    title: 'Menu Bar Integration',
    desc: 'Lives quietly in your menu bar as a resident utility — zero Dock clutter, always accessible.',
  },
  {
    icon: '🖥️',
    title: 'Native SwiftUI Dashboard',
    desc: 'A clean, native interface to pick your target display and start the lock engine in one click.',
  },
  {
    icon: '⚡',
    title: 'Launch at Login',
    desc: 'Registers with macOS ServiceManagement so your Dock is locked before you touch your keyboard.',
  },
]
</script>

<template>
  <section id="features" class="section features">
    <div class="site-container">
      <p class="section-label">Why Big DockLocker</p>
      <h2 class="section-title">Everything you need. Nothing you don't.</h2>
      <p class="section-sub">
        Lightweight (under 1 MB), sandboxed, no system modifications. Just rock-solid Dock stability
        for multi-monitor power users.
      </p>
      <div class="features-grid">
        <article v-for="f in features" :key="f.title" class="feature-card">
          <span class="feature-icon" aria-hidden="true">{{ f.icon }}</span>
          <h3 class="feature-title">{{ f.title }}</h3>
          <p class="feature-desc">{{ f.desc }}</p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.features {
  background: var(--bg);
}

.section-sub {
  margin-bottom: 56px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
}

.feature-card {
  background: var(--social-bg);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 28px 24px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: var(--shadow);
  }
}

.feature-icon {
  font-size: 28px;
  display: block;
  margin-bottom: 14px;
  line-height: 1;
}

.feature-title {
  margin-bottom: 8px;
  font-size: 17px;
}

.feature-desc {
  font-size: 15px;
  color: var(--text);
  line-height: 1.6;
}
</style>
