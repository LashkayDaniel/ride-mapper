<script setup lang="ts">
defineProps({
  modelValue: {
    type: String
  },
  placeholder: {
    type: String,
    default: ''
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'focus'])

const updateValue = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <input
    class="border border-gray-300 text-sm rounded-lg focus:outline-none focus:ring-0 focus:border-2 focus:border-gray-400 px-2 py-1"
    type="text"
    :placeholder="placeholder"
    :value="modelValue"
    @input="updateValue"
    @focus="emit('focus')"
    :readonly="readonly"
  >
</template>
