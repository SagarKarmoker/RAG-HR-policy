<template>
  <div class="page">
    <div class="page__inner">
      <header class="page-head">
        <div class="page-head__title">
          <h1 class="t-heading">Policies</h1>
          <p class="t-caption t-secondary">
            {{ pluralise(filtered.length, 'active policy') }} available to you. Drafts,
            expired, and archived versions are not listed.
          </p>
        </div>
      </header>

      <div class="row row-12 page__tools">
        <div class="field page__search">
          <label class="sr-only" for="policy-search">Search policies</label>
          <input
            id="policy-search"
            v-model="query"
            class="input"
            type="search"
            placeholder="Search titles, headings, and policy text"
          />
        </div>
        <AppButton
          variant="outline"
          icon="filter"
          :disabled="!categories.length"
          @click="categories = []"
        >
          Clear categories
        </AppButton>
      </div>

      <div class="row row-8 row--wrap page__cats">
        <button
          v-for="category in allCategories"
          :key="category"
          class="tag-link"
          type="button"
          :aria-pressed="categories.includes(category)"
          @click="toggleCategory(category)"
        >
          {{ category }}
        </button>
      </div>

      <hr class="divider" />

      <ul v-if="filtered.length" class="stack stack-8">
        <li v-for="doc in filtered" :key="doc.id">
          <RouterLink class="doc-card" :to="`/library/${doc.id}`">
            <div class="stack stack-6 doc-card__text">
              <div class="row row-8">
                <span class="t-title doc-card__title">{{ doc.title }}</span>
                <span class="badge">{{ doc.category }}</span>
              </div>
              <p class="t-caption t-secondary doc-card__excerpt">{{ firstLine(doc) }}</p>
              <p class="t-muted">
                Version {{ doc.version }} · {{ pluralise(doc.pages, 'page') }} · updated
                {{ formatDate(doc.updatedAt) }}
              </p>
            </div>
            <AppIcon name="chevronRight" :size="16" />
          </RouterLink>
        </li>
      </ul>

      <div v-else class="muted-panel stack stack-6">
        <p class="t-title">No policy matches that search.</p>
        <p class="t-caption t-secondary">
          Try a different word, or ask the question in the assistant — it will tell you if
          nothing in the policies covers it.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import AppButton from '../components/AppButton.vue'
import { visibleDocuments } from '../lib/store'
import { CATEGORIES } from '../lib/seed'
import { formatDate, pluralise } from '../lib/format'

const query = ref('')
const categories = ref([])

const allCategories = computed(() => {
  const present = new Set(visibleDocuments.value.map((d) => d.category))
  return [...CATEGORIES.filter((c) => present.has(c)), ...[...present].filter((c) => !CATEGORIES.includes(c))]
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return visibleDocuments.value.filter((doc) => {
    if (categories.value.length && !categories.value.includes(doc.category)) return false
    if (!q) return true
    const haystack = [
      doc.title,
      doc.category,
      ...doc.sections.map((s) => `${s.heading} ${s.body}`),
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
})

function toggleCategory(category) {
  categories.value = categories.value.includes(category)
    ? categories.value.filter((c) => c !== category)
    : [...categories.value, category]
}

function firstLine(doc) {
  const first = doc.sections[0]
  return first ? first.body : 'This policy has no readable text yet.'
}
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
  padding: var(--section-gap) var(--spacing-16) var(--section-gap);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-16);
}

.page__tools {
  align-items: stretch;
}

.page__search {
  flex: 1;
  max-width: 420px;
}

.doc-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-16);
  padding: var(--card-padding);
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-cards);
  color: var(--color-graphite-ink);
  transition: background-color 120ms ease, border-color 120ms ease;
}

.doc-card:hover {
  background: var(--color-sidebar-mist);
  border-color: #00000026;
}

.doc-card__text {
  min-width: 0;
  max-width: 78ch;
}

.doc-card__excerpt {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.doc-card__title {
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 820px) {
  .page__inner {
    padding-left: 56px;
  }
}
</style>
