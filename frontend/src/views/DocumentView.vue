<template>
  <div class="page">
    <div class="page__inner">
      <RouterLink class="back" to="/library">
        <AppIcon name="chevronRight" :size="14" />
        <span>All policies</span>
      </RouterLink>

      <template v-if="doc">
        <header class="stack stack-8 doc-head">
          <div class="row row-8 row--wrap">
            <span class="badge">{{ doc.category }}</span>
            <span class="badge">version {{ doc.version }}</span>
            <span class="badge" :class="{ 'badge--muted-dot': doc.status !== 'active' }">
              {{ doc.status }}
            </span>
          </div>
          <h1 class="t-heading">{{ doc.title }}</h1>
          <dl class="doc-meta">
            <div class="doc-meta__item">
              <dt class="t-label">Effective</dt>
              <dd class="t-caption">{{ formatDate(doc.effectiveDate) }}</dd>
            </div>
            <div class="doc-meta__item">
              <dt class="t-label">Review by</dt>
              <dd class="t-caption">{{ formatDate(doc.expiryDate) }}</dd>
            </div>
            <div class="doc-meta__item">
              <dt class="t-label">Source file</dt>
              <dd class="t-caption">{{ doc.fileName }} · {{ fileSize(doc.sizeKb) }}</dd>
            </div>
            <div class="doc-meta__item">
              <dt class="t-label">Last updated</dt>
              <dd class="t-caption">{{ formatDate(doc.updatedAt) }} by {{ doc.updatedBy }}</dd>
            </div>
          </dl>
          <p v-if="doc.note" class="doc-note">
            <AppIcon name="alert" :size="14" />
            <span>HR note: {{ doc.note }}</span>
          </p>
        </header>

        <article class="doc-body">
          <section v-for="section in doc.sections" :id="section.id" class="doc-section">
            <h2 class="t-title doc-section__title">{{ section.heading }}</h2>
            <p class="t-body t-secondary doc-section__text">{{ section.body }}</p>
          </section>
          <p v-if="!doc.sections.length" class="t-caption t-secondary">
            No readable text has been extracted from this file yet.
          </p>
        </article>
      </template>

      <div v-else class="muted-panel stack stack-6">
        <p class="t-title">That policy is not available.</p>
        <p class="t-caption t-secondary">
          It may have been deactivated or archived. People Operations can tell you which
          version replaced it.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { getDocument } from '../lib/store'
import { fileSize, formatDate } from '../lib/format'

const route = useRoute()
const doc = computed(() => getDocument(route.params.id))
</script>

<style scoped>
.page {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.page__inner {
  max-width: var(--reading-width);
  margin: 0 auto;
  padding: var(--section-gap) var(--spacing-16) var(--section-gap);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-16);
}

.back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  font-size: var(--text-caption);
  color: var(--color-mid-ash);
}

.back svg {
  transform: rotate(180deg);
}

.back:hover {
  color: var(--color-graphite-ink);
}

.doc-head {
  gap: var(--spacing-10);
  padding-bottom: var(--spacing-16);
  border-bottom: 1px solid var(--color-hairline);
}

.doc-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-12) var(--spacing-16);
  margin: 0;
}

.doc-meta__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.doc-meta dd {
  margin: 0;
  color: var(--color-graphite-ink);
}

.doc-note {
  display: flex;
  align-items: flex-start;
  gap: var(--element-gap);
  padding: 8px 10px;
  border-radius: var(--radius-nav);
  background: var(--color-sidebar-mist);
  font-size: var(--text-caption);
  line-height: var(--leading-caption);
}

.doc-body {
  display: flex;
  flex-direction: column;
  gap: var(--section-gap);
}

.doc-section {
  display: flex;
  flex-direction: column;
  gap: var(--element-gap);
  scroll-margin-top: var(--spacing-16);
}

.doc-section__text {
  max-width: 70ch;
}

@media (max-width: 820px) {
  .page__inner {
    padding-left: 56px;
  }
}
</style>
