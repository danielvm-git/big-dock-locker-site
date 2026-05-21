<script setup lang="ts">
</script>

<template>
  <header class="navbar">
    <div class="site-container navbar-inner">
      <a href="#" class="navbar-brand">
        <img src="/icon.png" alt="" class="navbar-icon" width="28" height="28" />
        <span class="navbar-name">Big DockLocker</span>
      </a>
      <nav class="navbar-actions">
        <a
          href="https://github.com/danielvm-git/big-dock-locker"
          target="_blank"
          rel="noopener noreferrer"
          class="navbar-gh"
          aria-label="GitHub repository"
        >
          <svg width="20" height="20" aria-hidden="true">
            <use href="/icons.svg#github-icon" />
          </svg>
          <span class="navbar-gh-label">GitHub</span>
        </a>
        <a href="#download" class="btn-primary navbar-cta">Download</a>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.navbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text-h);
  font-weight: 700;
  font-size: 16px;
}

.navbar-icon {
  border-radius: 7px;
  object-fit: cover;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.navbar-gh {
  display: flex;
  align-items: center;
  gap: 6px;
  text-decoration: none;
  color: var(--text);
  font-size: 15px;
  transition: color 0.2s;

  &:hover {
    color: var(--text-h);
  }
}

.navbar-cta {
  padding: 8px 18px;
  font-size: 14px;
}

@media (max-width: 480px) {
  .navbar-gh-label {
    display: none;
  }
}
</style>
