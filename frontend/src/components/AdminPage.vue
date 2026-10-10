<template>
  <div class="page">
    <div class="page__inner">
      <header class="page-head">
        <div class="page-head__title">
          <h1 class="t-heading">{{ title }}</h1>
          <p v-if="description" class="t-caption t-secondary">{{ description }}</p>
        </div>
        <div class="row row-8">
          <slot name="actions" />
        </div>
      </header>
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>

<style scoped>
.page {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.page__inner {
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: var(--section-gap) var(--spacing-16);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-16);
}

@media (max-width: 820px) {
  .page__inner {
    padding-left: 56px;
  }
}
</style>
