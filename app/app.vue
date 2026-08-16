<script setup lang="ts">
import { onMounted } from 'vue'

// Fullscreen can't be requested on load — browsers demand a user gesture — so we take the
// first tap. Touch devices only; iPhone Safari has no Fullscreen API, so there it's a no-op.
// ponytail: fires once. If someone swipes out of fullscreen we don't re-enter — drop the
// `once` and listen on fullscreenchange if that turns out to matter.
onMounted(() => {
  const el = document.documentElement
  if (!el.requestFullscreen || !matchMedia('(pointer: coarse)').matches) return
  addEventListener('pointerdown', () => { el.requestFullscreen().catch(() => {}) }, { once: true })
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>
