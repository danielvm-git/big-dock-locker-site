<script setup lang="ts">
import TheNavbar from './components/TheNavbar.vue'
import HeroSection from './components/HeroSection.vue'
import FeaturesSection from './components/FeaturesSection.vue'
import HowItWorksSection from './components/HowItWorksSection.vue'
import InstallSection from './components/InstallSection.vue'
import DownloadSection from './components/DownloadSection.vue'
import TheFooter from './components/TheFooter.vue'
</script>

<template>
  <TheNavbar />
  <main>
    <HeroSection />
    <FeaturesSection />
    <HowItWorksSection />
    <InstallSection />
    <DownloadSection />
  </main>
  <TheFooter />
</template>
