<template>
  <button
    class="icon-btn tooltip-host"
    type="button"
    :data-tip="tip"
    :aria-label="label"
    :aria-pressed="pressed === true ? 'true' : undefined"
    @click="$emit('click', $event)"
  >
    <AppIcon :name="icon" :size="size" />
  </button>
</template>

<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  icon: { type: String, required: true },
  tip: { type: String, default: '' },
  label: { type: String, default: '' },
  size: { type: [Number, String], default: 16 },
  pressed: { type: Boolean, default: false },
})

defineEmits(['click'])
</script>
