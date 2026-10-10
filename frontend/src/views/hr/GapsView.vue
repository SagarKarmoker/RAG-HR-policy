<template>
  <AdminPage
    title="Content gaps"
    description="Terms employees searched for that no active policy answered. Each one is a policy that is missing or unclear."
  >
    <div class="gaps">
      <div class="stack stack-8">
        <div class="row row-12">
          <div class="field gaps__search">
            <label class="sr-only" for="gap-search">Search gap terms</label>
            <input
              id="gap-search"
              v-model="query"
              class="input"
              type="search"
              placeholder="Search terms"
            />
          </div>
          <AppButton variant="outline" icon="upload" to="/hr/upload">
            Write a policy for this
          </AppButton>
        </div>

        <div class="card card--flush">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Term</th>
                <th scope="col">Searches</th>
                <th scope="col">First seen</th>
                <th scope="col">Last seen</th>
                <th scope="col"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="gap in filtered" :key="gap.term">
                <td class="t-title">{{ gap.term }}</td>
                <td>
                  <span class="badge">{{ gap.searches }}</span>
                </td>
                <td class="t-caption t-secondary">{{ formatDate(gap.firstSeen) }}</td>
                <td class="t-caption t-secondary">{{ formatDate(gap.lastSeen) }}</td>
                <td>
                  <div class="row row-8 table__actions">
                    <AppIconButton
                      icon="check"
                      tip="Mark as covered"
                      :label="`Mark ${gap.term} as covered`"
                      @click="removeGap(gap.term)"
                    />
                  </div>
                </td>
              </tr>
              <tr v-if="!filtered.length">
                <td colspan="5" class="table__empty">
                  <p class="t-title">Nothing outstanding.</p>
                  <p class="t-caption t-secondary">
                    Every search so far has been answered by an active policy.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <aside class="stack stack-16">
        <div class="card stack stack-8">
          <h2 class="t-title">How gaps are recorded</h2>
          <p class="t-caption t-secondary">
            When a question returns no supporting policy, the search term is recorded here
            with the date. Nothing about the individual employee is stored beyond the
            question log.
          </p>
        </div>
        <div class="card stack stack-8">
          <h2 class="t-title">Covered elsewhere</h2>
          <p class="t-caption t-secondary">
            Some terms are handled outside policy — immigration questions, tax in another
            country, or anything requiring a manager decision. Mark a term as covered when
            that route is the right answer.
          </p>
        </div>
      </aside>
    </div>
  </AdminPage>
</template>

<script setup>
import { computed, ref } from 'vue'
import AdminPage from '../../components/AdminPage.vue'
import AppButton from '../../components/AppButton.vue'
import AppIconButton from '../../components/AppIconButton.vue'
import { state, removeGap } from '../../lib/store'
import { formatDate } from '../../lib/format'

const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return [...state.gaps]
    .filter((gap) => (q ? gap.term.toLowerCase().includes(q) : true))
    .sort((a, b) => b.searches - a.searches)
})
</script>

<style scoped>
.gaps {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: var(--section-gap);
  align-items: start;
}

.gaps__search {
  flex: 1;
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

@media (max-width: 960px) {
  .gaps {
    grid-template-columns: 1fr;
  }
}
</style>
