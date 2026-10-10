<template>
  <article class="source">
    <header class="row row--between source__head">
      <div class="stack source__head-text">
        <span class="t-title source__title">{{ source.title }}</span>
        <span class="t-muted">
          {{ source.section }} · version {{ source.version }}
        </span>
      </div>
      <span class="badge">v{{ source.version }}</span>
    </header>

    <blockquote class="source__quote">{{ source.excerpt }}</blockquote>

    <p v-if="source.note" class="source__note">
      <AppIcon name="alert" :size="14" />
      <span>HR note: {{ source.note }}</span>
    </p>

    <RouterLink class="source__open" :to="`/library/${source.documentId}`">
      <span>Open the full policy</span>
      <AppIcon name="chevronRight" :size="14" />
    </RouterLink>
  </article>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import AppIcon from './AppIcon.vue'

defineProps({ source: { type: Object, required: true } })
</script>

<style scoped>
.source {
  display: flex;
  flex-direction: column;
  gap: var(--element-gap);
  padding: var(--card-padding);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-cards);
  background: var(--surface-elevated-panel);
}

.source__head {
  align-items: flex-start;
  gap: var(--spacing-12);
}

.source__head-text {
  gap: 2px;
  min-width: 0;
}

.source__title {
  overflow: hidden;
  text-overflow: ellipsis;
}

.source__quote {
  margin: 4px 0 0;
  padding-left: var(--spacing-12);
  border-left: 1px solid var(--color-edge-gray);
  font-size: var(--text-caption);
  line-height: var(--leading-body);
  color: var(--color-mid-ash);
}

.source__note {
  display: flex;
  align-items: flex-start;
  gap: var(--element-gap);
  padding: 8px 10px;
  border-radius: var(--radius-nav);
  background: var(--color-sidebar-mist);
  font-size: var(--text-caption);
  line-height: var(--leading-caption);
  color: var(--color-graphite-ink);
}

.source__open {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  padding: 2px 0;
  border-radius: var(--radius-links);
  font-size: var(--text-caption);
  line-height: var(--leading-caption);
  font-weight: var(--font-weight-medium);
  color: var(--color-mid-ash);
}

.source__open:hover {
  color: var(--color-graphite-ink);
}
</style>
