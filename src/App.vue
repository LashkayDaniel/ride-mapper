<script setup lang="ts">
import TheHeader from '@/components/TheHeader.vue'
</script>

<template>
  <div class="w-full h-screen flex flex-col">
    <TheHeader />
    <div class="w-full flex-1 overflow-auto">
      <RouterView />
    </div>
  </div>
</template>

