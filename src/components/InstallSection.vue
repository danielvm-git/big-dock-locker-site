<script setup lang="ts">
import { ref } from 'vue'

const COMMAND = 'xattr -dr com.apple.quarantine /Applications/BigDockLocker.app'
const copied = ref(false)

function copyCommand() {
  navigator.clipboard.writeText(COMMAND).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  })
}
</script>

<template>
  <section id="install" class="section install">
    <div class="site-container">
      <p class="section-label">Installation</p>
      <h2 class="section-title">Getting past Gatekeeper.</h2>
      <p class="section-sub">
        Because Big DockLocker is distributed outside the Mac App Store, macOS
        will warn you on first launch. Follow these steps once and you're done.
      </p>

      <div class="install-steps">
        <div class="install-step">
          <div class="install-step-num">1</div>
          <div class="install-step-body">
            <h3>Allow the App</h3>
            <p>
              Open the <strong>Applications</strong> folder and double-click
              <strong>Big DockLocker</strong>. When the warning appears, click
              <strong>OK</strong>. Then open
              <strong>System Settings → Privacy &amp; Security</strong>, scroll
              to the Security section, and click <strong>Open Anyway</strong>.
            </p>
          </div>
        </div>

        <div class="install-step">
          <div class="install-step-num">2</div>
          <div class="install-step-body">
            <h3>Grant Accessibility</h3>
            <p>
              Open <strong>System Settings → Privacy &amp; Security →
              Accessibility</strong>. Click the <strong>+</strong> button, add
              Big DockLocker from your Applications folder, and toggle the
              switch <strong>ON</strong>.
            </p>
          </div>
        </div>

        <div class="install-step">
          <div class="install-step-num">3</div>
          <div class="install-step-body">
            <h3>Power User Shortcut</h3>
            <p>
              Skip the System Settings steps entirely by running this command in
              Terminal — it removes the quarantine flag directly:
            </p>
            <div class="code-block">
              <code>{{ COMMAND }}</code>
              <button
                type="button"
                class="copy-btn"
                :class="{ copied }"
                @click="copyCommand"
                :aria-label="copied ? 'Copied!' : 'Copy command'"
              >
                {{ copied ? '✓ Copied' : 'Copy' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.install {
  background: var(--bg);
}

.install-steps {
  display: flex;
  flex-direction: column;
  gap: 36px;
  margin-top: 52px;
}

.install-step {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.install-step-num {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--accent-border);
  color: var(--accent);
  font-weight: 700;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.install-step-body {
  h3 {
    margin-bottom: 8px;
    font-size: 17px;
  }

  p {
    font-size: 15px;
    color: var(--text);
    line-height: 1.7;
  }
}

.code-block {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  background: var(--code-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 16px;
  flex-wrap: wrap;

  code {
    background: none;
    padding: 0;
    flex: 1;
    word-break: break-all;
  }
}

.copy-btn {
  flex-shrink: 0;
  padding: 5px 14px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-h);
  font-size: 13px;
  font-family: var(--sans);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;

  &:hover {
    border-color: var(--accent-border);
    color: var(--accent);
  }

  &.copied {
    background: var(--accent-bg);
    color: var(--accent);
    border-color: var(--accent-border);
  }
}
</style>
