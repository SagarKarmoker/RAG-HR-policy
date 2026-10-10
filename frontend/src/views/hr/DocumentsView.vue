<template>
  <AdminPage
    title="Documents"
    :description="`${activeCount} active · ${otherCount} not visible to employees · ${gapCount} sections indexed`"
  >
    <template #actions>
      <AppButton to="/hr/upload" variant="ink" icon="upload">Upload policy</AppButton>
    </template>

    <div class="row row-12 tools">
      <div class="field tools__search">
        <label class="sr-only" for="doc-search">Search documents</label>
        <input
          id="doc-search"
          v-model="query"
          class="input"
          type="search"
          placeholder="Search by title, category, or file name"
        />
      </div>
      <div class="row row-8 row--wrap tools__filters">
        <button
          v-for="status in statuses"
          :key="status"
          class="tag-link"
          type="button"
          :aria-pressed="statusFilter === status"
          @click="statusFilter = status"
        >
          {{ status }}
        </button>
      </div>
    </div>

    <div class="card card--flush">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">Document</th>
            <th scope="col">Category</th>
            <th scope="col">Version</th>
            <th scope="col">Status</th>
            <th scope="col">Indexing</th>
            <th scope="col">Updated</th>
            <th scope="col"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="doc in filtered" :key="doc.id">
            <td>
              <RouterLink class="table__title" :to="`/hr/documents/${doc.id}`">
                {{ doc.title }}
              </RouterLink>
              <span class="t-muted table__sub">{{ doc.fileName }}</span>
            </td>
            <td class="t-caption">{{ doc.category }}</td>
            <td class="t-caption">{{ doc.version }}</td>
            <td>
              <span class="badge" :class="{ 'badge--muted-dot': doc.status !== 'active' }">
                {{ doc.status }}
              </span>
            </td>
            <td>
              <span class="badge" :class="{ 'badge--muted-dot': doc.indexStatus !== 'indexed' }">
                {{ doc.indexStatus }}
              </span>
            </td>
            <td class="t-caption t-secondary">
              {{ formatDate(doc.updatedAt) }}
              <span class="table__sub">by {{ doc.updatedBy }}</span>
            </td>
            <td>
              <div class="row row-8 table__actions">
                <AppIconButton
                  icon="pencil"
                  tip="Edit metadata"
                  :label="`Edit ${doc.title}`"
                  @click="openEdit(doc)"
                />
                <AppIconButton
                  icon="refresh"
                  tip="Re-index"
                  :label="`Re-index ${doc.title}`"
                  @disabled="busyId === doc.id"
                  @click="reindex(doc)"
                />
                <AppIconButton
                  v-if="doc.status === 'active'"
                  icon="eye"
                  tip="Deactivate"
                  :label="`Deactivate ${doc.title}`"
                  @click="setStatus(doc, 'inactive')"
                />
                <AppIconButton
                  v-else
                  icon="refresh"
                  tip="Activate"
                  :label="`Activate ${doc.title}`"
                  @click="setStatus(doc, 'active')"
                />
                <AppIconButton
                  icon="trash"
                  tip="Delete"
                  :label="`Delete ${doc.title}`"
                  @click="openDelete(doc)"
                />
              </div>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="7" class="table__empty">
              <p class="t-title">No document matches these filters.</p>
              <p class="t-caption t-secondary">Clear the search or choose another status.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppModal
      :open="Boolean(editTarget)"
      :title="editTarget ? `Edit ${editTarget.title}` : ''"
      description="Changes apply to new answers immediately. Employees asking the same question afterwards will see the updated text."
      @close="editTarget = null"
    >
      <form class="stack stack-16" @submit.prevent="submitEdit">
        <div class="field">
          <label class="field__label" for="edit-title">Title</label>
          <input id="edit-title" v-model="editForm.title" class="input" required />
        </div>
        <div class="row row-12">
          <div class="field modal__half">
            <label class="field__label" for="edit-category">Category</label>
            <select id="edit-category" v-model="editForm.category" class="select">
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="field modal__half">
            <label class="field__label" for="edit-version">Version</label>
            <input id="edit-version" v-model="editForm.version" class="input" />
          </div>
        </div>
        <div class="row row-12">
          <div class="field modal__half">
            <label class="field__label" for="edit-effective">Effective from</label>
            <input id="edit-effective" v-model="editForm.effectiveDate" class="input" type="date" />
          </div>
          <div class="field modal__half">
            <label class="field__label" for="edit-expiry">Review by</label>
            <input id="edit-expiry" v-model="editForm.expiryDate" class="input" type="date" />
          </div>
        </div>
        <div class="field">
          <label class="field__label" for="edit-note">Note shown to employees with this source</label>
          <textarea
            id="edit-note"
            v-model="editForm.note"
            class="textarea"
            placeholder="For example: carry-over limit raised to 10 days for 2026–27."
          />
        </div>
      </form>
      <template #footer>
        <AppButton variant="veil" @click="editTarget = null">Cancel</AppButton>
        <AppButton variant="ink" @click="submitEdit">Save changes</AppButton>
      </template>
    </AppModal>

    <AppModal
      :open="Boolean(deleteTarget)"
      title="Delete this policy?"
      :description="deleteTarget ? deleteTarget.title : ''"
      @close="deleteTarget = null"
    >
      <p class="t-caption t-secondary">
        The document is removed from search and from all answers. Past answers keep their
        citation text so the history stays readable, but the policy will no longer be
        returned to new questions.
      </p>
      <template #footer>
        <AppButton variant="veil" @click="deleteTarget = null">Cancel</AppButton>
        <AppButton variant="ink" icon="trash" @click="confirmDelete">Delete policy</AppButton>
      </template>
    </AppModal>
  </AdminPage>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AdminPage from '../../components/AdminPage.vue'
import AppButton from '../../components/AppButton.vue'
import AppIconButton from '../../components/AppIconButton.vue'
import AppModal from '../../components/AppModal.vue'
import { state, saveDocument, setDocumentStatus, removeDocument, reindexDocument } from '../../lib/store'
import { CATEGORIES } from '../../lib/seed'
import { formatDate } from '../../lib/format'

const statuses = ['all', 'active', 'inactive', 'archived']
const categories = [...CATEGORIES, 'Uncategorised']

const query = ref('')
const statusFilter = ref('all')
const editTarget = ref(null)
const deleteTarget = ref(null)
const busyId = ref('')
const editForm = ref(blankForm())

function blankForm() {
  return {
    title: '',
    category: 'Leave',
    version: '1.0',
    effectiveDate: '',
    expiryDate: '',
    note: '',
  }
}

const activeCount = computed(
  () => state.documents.filter((d) => d.status === 'active').length,
)
const otherCount = computed(
  () => state.documents.filter((d) => d.status !== 'active').length,
)
const gapCount = computed(() =>
  state.documents.reduce((total, d) => total + d.sections.length, 0),
)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return state.documents.filter((doc) => {
    if (statusFilter.value !== 'all' && doc.status !== statusFilter.value) return false
    if (!q) return true
    return `${doc.title} ${doc.category} ${doc.fileName}`.toLowerCase().includes(q)
  })
})

function openEdit(doc) {
  editForm.value = {
    title: doc.title,
    category: doc.category,
    version: doc.version,
    effectiveDate: doc.effectiveDate || '',
    expiryDate: doc.expiryDate || '',
    note: doc.note || '',
  }
  editTarget.value = doc
}

async function submitEdit() {
  if (!editTarget.value || !editForm.value.title.trim()) return
  await saveDocument({
    id: editTarget.value.id,
    ...editForm.value,
    effectiveDate: editForm.value.effectiveDate || null,
    expiryDate: editForm.value.expiryDate || null,
  })
  editTarget.value = null
}

async function setStatus(doc, status) {
  await setDocumentStatus(doc.id, status)
}

async function reindex(doc) {
  busyId.value = doc.id
  await reindexDocument(doc.id)
  busyId.value = ''
}

function openDelete(doc) {
  deleteTarget.value = doc
}

async function confirmDelete() {
  await removeDocument(deleteTarget.value.id)
  deleteTarget.value = null
}
</script>

<style scoped>
.tools {
  align-items: center;
  flex-wrap: wrap;
}

.tools__search {
  flex: 1;
  min-width: 240px;
  max-width: 380px;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: 10px var(--card-padding);
  border-bottom: 1px solid var(--color-hairline);
  font-size: var(--text-caption);
  line-height: var(--leading-caption);
  font-weight: var(--font-weight-medium);
  color: var(--color-mid-ash);
  white-space: nowrap;
}

.table td {
  padding: 12px var(--card-padding);
  border-bottom: 1px solid var(--color-hairline);
  vertical-align: middle;
}

.table tr:last-child td {
  border-bottom: 0;
}

.table tbody tr:hover {
  background: var(--color-sidebar-mist);
}

.table__title {
  display: block;
  font-size: var(--text-caption);
  font-weight: var(--font-weight-medium);
  color: var(--color-graphite-ink);
}

.table__title:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.table__sub {
  display: block;
  font-size: 12px;
  line-height: 1.4;
  color: var(--color-hollow);
}

.table__actions {
  justify-content: flex-end;
  opacity: 0.35;
  transition: opacity 120ms ease;
}

.table tbody tr:hover .table__actions,
.table__actions:focus-within {
  opacity: 1;
}

.table__empty {
  padding: var(--section-gap);
  text-align: left;
}

.modal__half {
  flex: 1;
}
</style>
