<template>
  <AdminPage
    :title="doc ? doc.title : 'Document'"
    :description="doc ? `${doc.fileName} · ${fileSize(doc.sizeKb)} · updated ${formatDate(doc.updatedAt)} by ${doc.updatedBy}` : ''"
  >
    <template #actions>
      <AppButton to="/hr/documents" variant="veil" icon="chevronLeft">All documents</AppButton>
      <AppButton variant="ink" :disabled="!dirty" @click="save">Save changes</AppButton>
    </template>

    <template v-if="doc">
      <div class="layout">
        <section class="card stack stack-16">
          <div class="stack stack-6">
            <h2 class="t-title">Metadata</h2>
            <p class="t-caption t-secondary">
              Titles, categories, and dates are shown to employees and are used to group
              answers.
            </p>
          </div>

          <div class="field">
            <label class="field__label" for="title">Title</label>
            <input id="title" v-model="form.title" class="input" />
          </div>

          <div class="row row-12">
            <div class="field half">
              <label class="field__label" for="category">Category</label>
              <select id="category" v-model="form.category" class="select">
                <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="field half">
              <label class="field__label" for="version">Version</label>
              <input id="version" v-model="form.version" class="input" />
            </div>
          </div>

          <div class="row row-12">
            <div class="field half">
              <label class="field__label" for="effective">Effective from</label>
              <input id="effective" v-model="form.effectiveDate" class="input" type="date" />
            </div>
            <div class="field half">
              <label class="field__label" for="expiry">Review by</label>
              <input id="expiry" v-model="form.expiryDate" class="input" type="date" />
            </div>
          </div>

          <div class="field">
            <label class="field__label" for="note">Note shown with the citation</label>
            <textarea id="note" v-model="form.note" class="textarea" />
            <p class="field__hint">
              Appears under the quoted text whenever this policy is cited in an answer.
            </p>
          </div>

          <hr class="divider" />

          <div class="stack stack-8">
            <h2 class="t-title">Visibility</h2>
            <p class="t-caption t-secondary">
              Only active documents are searched and cited. Deactivating keeps the history
              readable and removes it from answers.
            </p>
            <div class="row row-8">
              <AppButton
                v-for="status in statuses"
                :key="status"
                variant="outline"
                :pressed="doc.status === status"
                @click="changeStatus(status)"
              >
                {{ status }}
              </AppButton>
            </div>
          </div>

          <hr class="divider" />

          <div class="stack stack-8">
            <h2 class="t-title">Replace the file</h2>
            <p class="t-caption t-secondary">
              Uploading a new file extracts the text again and marks the previous version
              inactive. Answers already given keep their original citation.
            </p>
            <div class="row row-8">
              <input
                ref="fileInput"
                class="sr-only"
                type="file"
                accept=".pdf,.docx,.txt,.md"
                @change="onReplace"
              />
              <AppButton variant="outline" icon="upload" @click="fileInput?.click()">
                Choose a replacement file
              </AppButton>
            </div>
          </div>
        </section>

        <section class="stack stack-16">
          <div class="card stack stack-8">
            <div class="row row--between">
              <h2 class="t-title">Indexed sections</h2>
              <span class="badge">{{ pluralise(doc.sections.length, 'section') }}</span>
            </div>
            <p class="t-caption t-secondary">
              Each section is one chunk of searchable text. The section heading is what
              employees see next to an answer.
            </p>
            <div class="row row-8">
              <AppButton variant="outline" icon="refresh" @click="reindex">Re-index document</AppButton>
            </div>
          </div>

          <ol class="stack stack-8">
            <li v-for="section in doc.sections" :key="section.id" class="card stack stack-6">
              <p class="t-title">{{ section.heading }}</p>
              <p class="t-caption t-secondary">{{ section.body }}</p>
              <p v-if="section.keywords?.length" class="row row-8 row--wrap">
                <span v-for="key in section.keywords" :key="key" class="badge badge--plain">
                  {{ key }}
                </span>
              </p>
            </li>
            <li v-if="!doc.sections.length" class="muted-panel t-caption t-secondary">
              Nothing has been extracted from this file yet.
            </li>
          </ol>
        </section>
      </div>
    </template>

    <div v-else class="muted-panel stack stack-6">
      <p class="t-title">Document not found.</p>
      <p class="t-caption t-secondary">It may have been deleted from another session.</p>
    </div>
  </AdminPage>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminPage from '../../components/AdminPage.vue'
import AppButton from '../../components/AppButton.vue'
import {
  getDocument,
  saveDocument,
  setDocumentStatus,
  reindexDocument,
} from '../../lib/store'
import { CATEGORIES } from '../../lib/seed'
import { fileSize, formatDate, pluralise } from '../../lib/format'

const route = useRoute()
const categories = [...CATEGORIES, 'Uncategorised']
const statuses = ['active', 'inactive', 'archived']
const fileInput = ref(null)

const doc = computed(() => getDocument(route.params.id))

const form = ref({
  title: '',
  category: 'Leave',
  version: '1.0',
  effectiveDate: '',
  expiryDate: '',
  note: '',
})

watch(
  doc,
  (value) => {
    if (!value) return
    form.value = {
      title: value.title,
      category: value.category,
      version: value.version,
      effectiveDate: value.effectiveDate || '',
      expiryDate: value.expiryDate || '',
      note: value.note || '',
    }
  },
  { immediate: true },
)

const dirty = computed(() => {
  if (!doc.value) return false
  const current = doc.value
  return (
    form.value.title !== current.title ||
    form.value.category !== current.category ||
    form.value.version !== current.version ||
    form.value.effectiveDate !== (current.effectiveDate || '') ||
    form.value.expiryDate !== (current.expiryDate || '') ||
    form.value.note !== (current.note || '')
  )
})

async function save() {
  if (!doc.value) return
  await saveDocument({
    id: doc.value.id,
    ...form.value,
    effectiveDate: form.value.effectiveDate || null,
    expiryDate: form.value.expiryDate || null,
  })
}

async function changeStatus(status) {
  if (!doc.value) return
  await setDocumentStatus(doc.value.id, status)
}

async function reindex() {
  if (!doc.value) return
  await reindexDocument(doc.value.id)
}

async function onReplace(event) {
  const file = event.target.files?.[0]
  if (!file || !doc.value) return
  await saveDocument({
    id: doc.value.id,
    fileName: file.name,
    fileType: (file.name.split('.').pop() || '').toUpperCase(),
    sizeKb: Math.max(1, Math.round(file.size / 1024)),
    newFile: true,
  })
  event.target.value = ''
}
</script>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--section-gap);
  align-items: start;
}

.half {
  flex: 1;
}

@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
