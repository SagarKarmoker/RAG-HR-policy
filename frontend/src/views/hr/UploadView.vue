<template>
  <AdminPage
    title="Upload policy"
    description="Upload a document, fill in its metadata, and publish it. Text is extracted and indexed before it becomes searchable."
  >
    <div class="upload">
      <section class="stack stack-16">
        <div
          class="dropzone"
          :class="{ 'dropzone--active': dragging, 'dropzone--filled': Boolean(file) }"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="onDrop"
        >
          <input
            ref="fileInput"
            class="sr-only"
            type="file"
            accept=".pdf,.docx,.txt,.md"
            @change="onPick"
          />
          <template v-if="!file">
            <AppIcon name="upload" :size="20" />
            <p class="t-title">Drop a file here</p>
            <p class="t-caption t-secondary">
              PDF, DOCX, TXT, or Markdown. Under 25 MB. Scanned PDFs without a text layer
              cannot be read and will be rejected.
            </p>
            <AppButton variant="outline" @click="fileInput?.click()">Choose a file</AppButton>
          </template>
          <template v-else>
            <div class="row row-8">
              <AppIcon name="file" :size="18" />
              <div class="stack">
                <span class="t-title">{{ file.name }}</span>
                <span class="t-muted">{{ fileSize(Math.round(file.size / 1024)) }} · {{ fileType }}</span>
              </div>
            </div>
            <div class="row row-8">
              <AppButton variant="outline" @click="fileInput?.click()">Replace file</AppButton>
              <AppButton variant="veil" @click="clearFile">Remove</AppButton>
            </div>
          </template>
        </div>

        <div v-if="phase !== 'idle'" class="card stack stack-8">
          <div class="row row--between">
            <p class="t-title">{{ phaseTitle }}</p>
            <span class="badge">{{ phaseBadge }}</span>
          </div>
          <div class="progress" role="progressbar" :aria-valuenow="progress" aria-valuemin="0" aria-valuemax="100">
            <span class="progress__fill" :style="{ width: `${progress}%` }" />
          </div>
          <p class="t-caption t-secondary">{{ phaseHelp }}</p>
          <div v-if="uploaded" class="row row-8">
            <AppButton to="/library" variant="outline">View as an employee</AppButton>
            <AppButton :to="`/hr/documents/${uploaded.id}`" variant="ink">
              Review {{ uploaded.title }}
            </AppButton>
          </div>
        </div>

        <div class="card stack stack-12">
          <h2 class="t-title">Before you upload</h2>
          <ul class="stack stack-8">
            <li v-for="item in checklist" :key="item.title" class="row row-8 stack--top">
              <AppIcon name="check" :size="14" />
              <div class="stack">
                <span class="t-caption t-title">{{ item.title }}</span>
                <span class="t-muted">{{ item.detail }}</span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section class="card stack stack-16">
        <div class="stack stack-6">
          <h2 class="t-title">Metadata</h2>
          <p class="t-caption t-secondary">
            The title and category appear beside every answer taken from this document.
          </p>
        </div>

        <div class="field">
          <label class="field__label" for="u-title">Title</label>
          <input id="u-title" v-model="form.title" class="input" placeholder="Leave and Time Off Policy" />
        </div>

        <div class="row row-12">
          <div class="field half">
            <label class="field__label" for="u-category">Category</label>
            <select id="u-category" v-model="form.category" class="select">
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="field half">
            <label class="field__label" for="u-version">Version</label>
            <input id="u-version" v-model="form.version" class="input" placeholder="1.0" />
          </div>
        </div>

        <div class="row row-12">
          <div class="field half">
            <label class="field__label" for="u-effective">Effective from</label>
            <input id="u-effective" v-model="form.effectiveDate" class="input" type="date" />
          </div>
          <div class="field half">
            <label class="field__label" for="u-expiry">Review by</label>
            <input id="u-expiry" v-model="form.expiryDate" class="input" type="date" />
          </div>
        </div>

        <div class="field">
          <label class="field__label" for="u-status">Visibility after upload</label>
          <select id="u-status" v-model="form.status" class="select">
            <option value="active">Active — searchable and cited immediately</option>
            <option value="inactive">Inactive — stored, not searchable</option>
          </select>
          <p class="field__hint">
            Upload as inactive if the document still needs legal review. Flip it to active
            from the document page when it is ready.
          </p>
        </div>

        <div class="field">
          <label class="field__label" for="u-note">Note shown with the citation</label>
          <textarea
            id="u-note"
            v-model="form.note"
            class="textarea"
            placeholder="For example: draft pending sign-off from the works council."
          />
        </div>

        <div class="row row-8 upload__actions">
          <AppButton variant="ink" icon="upload" large :disabled="!canSubmit" @click="submit">
            {{ phase === 'uploading' ? 'Uploading…' : 'Upload and index' }}
          </AppButton>
          <AppButton variant="veil" :disabled="phase === 'uploading'" @click="reset">Clear form</AppButton>
        </div>
        <p v-if="error" class="field__error">{{ error }}</p>
      </section>
    </div>
  </AdminPage>
</template>

<script setup>
import { computed, ref } from 'vue'
import AdminPage from '../../components/AdminPage.vue'
import AppButton from '../../components/AppButton.vue'
import AppIcon from '../../components/AppIcon.vue'
import { simulatedUpload } from '../../lib/api'
import { saveDocument } from '../../lib/store'
import { CATEGORIES } from '../../lib/seed'
import { fileSize } from '../../lib/format'

const categories = [...CATEGORIES, 'Uncategorised']

const checklist = [
  {
    title: 'One policy per file',
    detail: 'A file covering several policies is split into sections that are hard to cite.',
  },
  {
    title: 'Numbered headings',
    detail: 'Each section heading is what employees read beside an answer, so keep them short.',
  },
  {
    title: 'Text, not scans',
    detail: 'A PDF that is only an image has no text to extract and will answer nothing.',
  },
  {
    title: 'One owner',
    detail: 'Every document records who last changed it and when.',
  },
]

const fileInput = ref(null)
const file = ref(null)
const dragging = ref(false)
const phase = ref('idle')
const progress = ref(0)
const uploaded = ref(null)
const error = ref('')

const form = ref(blank())

function blank() {
  return {
    title: '',
    category: 'Leave',
    version: '1.0',
    status: 'active',
    effectiveDate: '',
    expiryDate: '',
    note: '',
  }
}

const fileType = computed(() =>
  file.value ? (file.value.name.split('.').pop() || '').toUpperCase() : '',
)

const canSubmit = computed(
  () => Boolean(file.value) && form.value.title.trim().length > 2 && phase.value !== 'uploading',
)

const phaseTitle = computed(() =>
  ({
    uploading: 'Uploading and extracting text',
    done: 'Indexed and searchable',
  })[phase.value] || '',
)

const phaseBadge = computed(() => (phase.value === 'done' ? 'indexed' : 'processing'))

const phaseHelp = computed(() =>
  ({
    uploading:
      'Splitting the document into sections and building the search index. This normally takes under two minutes.',
    done:
      'Employees can now ask questions that this document answers. Check the extracted sections before you rely on them.',
  })[phase.value] || '',
)

function accept(next) {
  const allowed = ['pdf', 'docx', 'txt', 'md']
  const ext = (next.name.split('.').pop() || '').toLowerCase()
  if (!allowed.includes(ext)) {
    error.value = `${ext.toUpperCase() || 'That file type'} is not supported. Use PDF, DOCX, TXT, or Markdown.`
    return
  }
  if (next.size > 25 * 1024 * 1024) {
    error.value = 'That file is over 25 MB. Split it into smaller policies.'
    return
  }
  error.value = ''
  file.value = next
  uploaded.value = null
  phase.value = 'idle'
  progress.value = 0
  if (!form.value.title) {
    form.value.title = next.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ')
  }
}

function onPick(event) {
  const next = event.target.files?.[0]
  if (next) accept(next)
  event.target.value = ''
}

function onDrop(event) {
  dragging.value = false
  const next = event.dataTransfer?.files?.[0]
  if (next) accept(next)
}

function clearFile() {
  file.value = null
  phase.value = 'idle'
  progress.value = 0
}

function reset() {
  clearFile()
  form.value = blank()
  uploaded.value = null
  error.value = ''
}

async function submit() {
  if (!canSubmit.value) return
  error.value = ''
  phase.value = 'uploading'
  progress.value = 20

  const ticker = setInterval(() => {
    if (progress.value < 85) progress.value += 15
  }, 260)

  try {
    const doc = await simulatedUpload(file.value)
    await saveDocument({
      id: doc.id,
      title: form.value.title.trim(),
      category: form.value.category,
      version: form.value.version.trim() || '1.0',
      status: form.value.status,
      effectiveDate: form.value.effectiveDate || null,
      expiryDate: form.value.expiryDate || null,
      note: form.value.note.trim(),
      fileName: doc.fileName,
      fileType: doc.fileType,
      sizeKb: doc.sizeKb,
      pages: doc.pages,
    })
    progress.value = 100
    phase.value = 'done'
    uploaded.value = doc
  } catch (err) {
    error.value = err.message || 'The upload failed. Try again.'
    phase.value = 'idle'
  } finally {
    clearInterval(ticker)
  }
}
</script>

<style scoped>
.upload {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--section-gap);
  align-items: start;
}

.dropzone {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--spacing-10);
  padding: var(--section-gap);
  border: 1px dashed #00000026;
  border-radius: var(--radius-cards);
  background: var(--color-sidebar-mist);
  color: var(--color-graphite-ink);
  transition: border-color 120ms ease, background-color 120ms ease;
}

.dropzone--active {
  border-color: var(--color-graphite-ink);
  background: var(--color-pure-white);
}

.dropzone--filled {
  border-style: solid;
  background: var(--color-pure-white);
}

.dropzone .t-caption {
  max-width: 44ch;
}

.progress {
  height: 4px;
  width: 100%;
  background: var(--color-edge-gray);
  border-radius: 2px;
  overflow: hidden;
}

.progress__fill {
  display: block;
  height: 100%;
  background: var(--color-graphite-ink);
  transition: width 220ms ease;
}

.half {
  flex: 1;
}

.upload__actions {
  padding-top: var(--spacing-6);
}

@media (max-width: 960px) {
  .upload {
    grid-template-columns: 1fr;
  }
}
</style>
