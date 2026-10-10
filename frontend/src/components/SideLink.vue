<template>
  <RouterLink :to="to" class="side-link" active-class="side-link--active">
    <AppIcon :name="icon" :size="16" />
    <span class="side-link__label"><slot /></span>
  </RouterLink>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import AppIcon from './AppIcon.vue'

defineProps({
  to: { type: String, required: true },
  icon: { type: String, default: '' },
})
</script>

<style scoped>
.side-link {
  display: flex;
  align-items: center;
  gap: var(--element-gap);
  padding: 6px 10px;
  border-radius: var(--radius-nav);
  color: var(--color-graphite-ink);
  font-size: var(--text-caption);
  line-height: var(--leading-caption);
  transition: background-color 120ms ease;
}

.side-link:hover {
  background: var(--color-hover-veil);
}

.side-link--active {
  background: var(--color-hover-veil);
  font-weight: var(--font-weight-medium);
}

.side-link__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
