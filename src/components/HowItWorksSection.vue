<script setup lang="ts">
interface Step {
  num: number
  title: string
  body: string
}

const steps: Step[] = [
  {
    num: 1,
    title: 'Download',
    body: 'Grab the DMG for your Mac chip — Apple Silicon (M1/M2/M3/M4) or Intel — from the GitHub Releases page.',
  },
  {
    num: 2,
    title: 'Grant Permissions',
    body: 'Approve the app in System Settings → Privacy & Security, then enable Accessibility access so it can intercept Dock gestures.',
  },
  {
    num: 3,
    title: 'Start Engine',
    body: 'Open the dashboard from the menu bar icon, choose which display should hold your Dock, and click Start Engine.',
  },
]
</script>

<template>
  <section id="how-it-works" class="section how">
    <div class="site-container">
      <p class="section-label">Setup</p>
      <h2 class="section-title">Up and running in three steps.</h2>
      <div class="steps">
        <div
          v-for="(step, i) in steps"
          :key="step.num"
          class="step"
        >
          <div class="step-connector" v-if="i < steps.length - 1" aria-hidden="true" />
          <div class="step-num">{{ step.num }}</div>
          <h3 class="step-title">{{ step.title }}</h3>
          <p class="step-body">{{ step.body }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.how {
  background: var(--social-bg);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.steps {
  display: flex;
  gap: 0;
  margin-top: 56px;
  position: relative;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 40px;
  }
}

.step {
  flex: 1;
  padding: 0 32px;
  position: relative;

  &:first-child {
    padding-left: 0;
  }

  &:last-child {
    padding-right: 0;
  }

  @media (max-width: 768px) {
    padding: 0;
  }
}

.step-connector {
  position: absolute;
  top: 20px;
  right: -4px;
  width: calc(100% - 48px);
  left: 52px;
  height: 2px;
  background: var(--border);
  z-index: 0;

  @media (max-width: 768px) {
    display: none;
  }
}

.step-num {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.step-title {
  margin-bottom: 10px;
}

.step-body {
  font-size: 15px;
  color: var(--text);
  line-height: 1.65;
}
</style>
