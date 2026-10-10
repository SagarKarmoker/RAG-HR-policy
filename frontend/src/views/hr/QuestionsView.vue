<template>
  <AdminPage
    title="Question log"
    description="Every question asked by employees, newest first. Answers that cite a document are recorded with the version they were taken from."
  >
    <template #actions>
      <AppButton variant="outline" icon="refresh" @click="freshen">
        {{ refreshedAt ? `Updated ${refreshedAt}` : 'Refresh' }}
      </AppButton>
    </template>

    <div class="row row-12 tools">
      <div class="field tools__search">
        <label class="sr-only" for="q-search">Search questions and answers</label>
        <input
          id="q-search"
          v-model="query"
          class="input"
          type="search"
          placeholder="Search questions, answers, and cited documents"
        />
      </div>
      <div class="row row-8 row--wrap">
        <button
          v-for="filter in filters"
          :key="filter.value"
          class="tag-link"
          type="button"
          :aria-pressed="outcomeFilter === filter.value"
          @click="outcomeFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <div class="stats">
      <div v-for="stat in stats" :key="stat.label" class="stat">
        <span class="t-label">{{ stat.label }}</span>
        <span class="t-title stat__value">{{ stat.value }}</span>
      </div>
    </div>

    <div class="card card--flush">
      <table class="table">
        <thead>
          <tr>
            <th scope="col">Question</th>
            <th scope="col">Outcome</th>
            <th scope="col">Cited</th>
            <th scope="col">Rating</th>
            <th scope="col">Asked</th>
            <th scope="col"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in filtered" :key="row.id">
            <td>
              <button class="table__title table__title--button" type="button" @click="open(row)">
                {{ row.question }}
              </button>
              <span class="t-muted table__sub">{{ truncate(row.answer, 110) }}</span>
            </td>
            <td>
              <span class="badge" :class="{ 'badge--muted-dot': row.outcome !== 'answered' }">
                {{ row.outcome === 'answered' ? 'answered' : 'no policy' }}
              </span>
            </td>
            <td class="t-caption t-secondary">
              <template v-if="row.sources.length">
                {{ row.sources[0].title }} v{{ row.sources[0].version }}
              </template>
              <template v-else>—</template>
            </td>
            <td class="t-caption">
              <template v-if="row.rating === 'up'">Helpful</template>
              <template v-else-if="row.rating === 'down'">Not helpful</template>
              <template v-else>—</template>
            </td>
            <td class="t-caption t-secondary">{{ formatDateTime(row.askedAt) }}</td>
            <td>
              <div class="row row-8 table__actions">
                <AppIconButton icon="eye" tip="Open" :label="`Open answer`" @click="open(row)" />
                <AppIconButton
                  icon="refresh"
                  tip="Ask again"
                  :label="`Ask again: ${row.question}`"
                  @click="open(row)"
                />
              </div>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="6" class="table__empty">
              <p class="t-title">No questions match this filter.</p>
              <p class="t-caption t-secondary">Questions appear here as employees ask them.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppModal
      :open="Boolean(openRow)"
      :title="openRow?.question || ''"
      :description="openRow ? `${openRow.asker} · ${formatDateTime(openRow.askedAt)}` : ''"
      wide
      @close="openRow = null"
    >
      <div class="stack stack-12">
        <div class="muted-panel">
          <p class="t-label">Answer given at the time</p>
          <p class="t-body stack stack-8">{{ openRow?.answer }}</p>
        </div>

        <div v-if="openRow?.sources.length" class="stack stack-8">
          <p class="t-label">Cited sections</p>
          <SourceCard v-for="(source, i) in openRow.sources" :key="i" :source="source" />
        </div>
        <p v-else class="t-caption t-secondary">
          No policy supported this answer. The refusal was returned to the employee with
          the nearest documents.
        </p>

        <div v-if="recheck" class="stack stack-8">
          <p class="t-label">Asked again just now</p>
          <div class="muted-panel">
            <p class="t-body">{{ recheck.content }}</p>
          </div>
          <p class="t-caption t-secondary">
            {{
              recheck.outcome === 'answered'
                ? `Now answered from ${recheck.sources.map((s) => `${s.title} v${s.version}`).join(', ')}.`
                : 'Still no active policy covers this question.'
            }}
          </p>
        </div>
      </div>

      <template #footer>
        <AppButton variant="veil" @click="openRow = null">Close</AppButton>
        <AppButton variant="ink" icon="refresh" :disabled="rechecking" @click="reask">
          {{ rechecking ? 'Asking…' : 'Ask again with current policies' }}
        </AppButton>
      </template>
    </AppModal>
  </AdminPage>
</template>

<script setup>
import { computed, ref } from 'vue'
import AdminPage from '../../components/AdminPage.vue'
import AppButton from '../../components/AppButton.vue'
import AppIconButton from '../../components/AppIconButton.vue'
import AppModal from '../../components/AppModal.vue'
import SourceCard from '../../components/SourceCard.vue'
import { state } from '../../lib/store'
import { reaskQuestion } from '../../lib/api'
import { formatDateTime } from '../../lib/format'

const filters = [
  { value: 'all', label: 'All' },
  { value: 'answered', label: 'Answered' },
  { value: 'refused', label: 'No policy' },
]

const query = ref('')
const outcomeFilter = ref('all')
const openRow = ref(null)
const recheck = ref(null)
const rechecking = ref(false)
const refreshedAt = ref('')

const rows = computed(() =>
  state.threads
    .flatMap((thread) =>
      thread.messages
        .filter((message) => message.role === 'assistant')
        .map((message) => {
          const question = [...thread.messages]
            .reverse()
            .find((m) => m.role === 'user' && m.createdAt <= message.createdAt)
          return {
            id: message.id,
            question: question?.content || 'Question removed',
            answer: message.content,
            outcome: message.outcome,
            sources: message.sources || [],
            rating: state.ratings[message.id] || null,
            askedAt: message.createdAt,
            asker: 'Riya Menon',
          }
        }),
    )
    .sort((a, b) => (a.askedAt < b.askedAt ? 1 : -1)),
)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    if (outcomeFilter.value !== 'all' && row.outcome !== outcomeFilter.value) return false
    if (!q) return true
    return `${row.question} ${row.answer} ${row.sources.map((s) => s.title).join(' ')}`
      .toLowerCase()
      .includes(q)
  })
})

const stats = computed(() => {
  const answered = rows.value.filter((r) => r.outcome === 'answered').length
  const refused = rows.value.length - answered
  const rated = rows.value.filter((r) => r.rating === 'up').length
  return [
    { label: 'Questions logged', value: rows.value.length },
    { label: 'Answered from a policy', value: answered },
    { label: 'No policy found', value: refused },
    { label: 'Marked helpful', value: rated },
  ]
})

function truncate(text, max) {
  const clean = String(text).replace(/\n+/g, ' ')
  return clean.length > max ? `${clean.slice(0, max)}…` : clean
}

function open(row) {
  openRow.value = row
  recheck.value = null
}

async function reask() {
  if (!openRow.value) return
  rechecking.value = true
  try {
    recheck.value = await reaskQuestion(openRow.value.question)
  } finally {
    rechecking.value = false
  }
}

function freshen() {
  refreshedAt.value = new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
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
  max-width: 420px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--spacing-12);
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-cards);
  background: var(--color-sidebar-mist);
}

.stat__value {
  font-size: var(--text-body);
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
  max-width: 46ch;
  font-size: var(--text-caption);
  font-weight: var(--font-weight-medium);
  color: var(--color-graphite-ink);
  text-align: left;
}

.table__title:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.table__sub {
  display: block;
  max-width: 52ch;
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
}
</style>
