<script setup lang="ts">
import { useLatestRelease } from '../composables/useLatestRelease'

const { release } = useLatestRelease()
</script>

<template>
  <footer class="footer">
    <div class="site-container footer-inner">
      <div class="footer-brand">
        <img src="/icon.png" alt="" width="22" height="22" class="footer-icon" />
        <span class="footer-name">Big DockLocker</span>
        <span v-if="release?.tag" class="footer-version">{{ release.tag }}</span>
      </div>
      <div class="footer-links">
        <a
          href="https://github.com/danielvm-git/big-dock-locker"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-link"
        >
          <svg width="18" height="18" aria-hidden="true">
            <use href="/icons.svg#github-icon" />
          </svg>
          GitHub
        </a>
        <a
          href="https://github.com/danielvm-git/big-dock-locker/blob/main/LICENSE"
          target="_blank"
          rel="noopener noreferrer"
          class="footer-link"
        >
          MIT License
        </a>
      </div>
      <p class="footer-copy">© 2026 Daniel VM</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  border-top: 1px solid var(--border);
  padding: 32px 0;
  margin-top: auto;
}

.footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: var(--text-h);
}

.footer-icon {
  border-radius: 5px;
  object-fit: cover;
}

.footer-version {
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 400;
  color: var(--text);
  background: var(--code-bg);
  padding: 2px 7px;
  border-radius: 4px;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 20px;
}

.footer-link {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  text-decoration: none;
  color: var(--text);
  transition: color 0.2s;

  &:hover {
    color: var(--text-h);
  }
}

.footer-copy {
  font-size: 13px;
  color: var(--text);
}
</style>
