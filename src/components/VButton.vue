<script setup lang="ts">
interface Props {
  type?: 'button' | 'submit' | 'reset';
}

withDefaults(defineProps<Props>(), { type: 'button' })
const emit = defineEmits(['click'])
</script>

<template>
  <button
    :type="type"
    class="bg-black/90 text-white px-4 py-1 rounded-full hover:bg-black/80 transition-colors"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>
