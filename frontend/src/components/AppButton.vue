<template>
  <component
    :is="to ? RouterLink : 'button'"
    :to="to"
    :type="to ? undefined : type"
    class="btn"
    :class="[
      `btn--${variant}`,
      { 'btn--block': block, 'btn--lg': large, 'btn--pressed': pressed },
    ]"
    :aria-pressed="pressed ? 'true' : undefined"
    :disabled="disabled"
  >
    <AppIcon v-if="icon" :name="icon" :size="size === 'sm' ? 14 : 16" />
    <slot />
  </component>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import AppIcon from './AppIcon.vue'

defineProps({
  variant: { type: String, default: 'veil' },
  icon: { type: String, default: '' },
  to: { type: [String, Object], default: '' },
  type: { type: String, default: 'button' },
  size: { type: String, default: 'md' },
  block: { type: Boolean, default: false },
  large: { type: Boolean, default: false },
  pressed: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
</script>
