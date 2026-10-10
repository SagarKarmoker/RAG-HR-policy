<template>
  <div class="signin">
    <div class="signin__panel">
      <div class="signin__intro">
        <div class="row row-8 signin__mark">
          <AppIcon name="logo" :size="20" />
          <span class="t-label">People Operations</span>
        </div>
        <h1 class="t-heading signin__title">
          Answers about company policy, taken from the policy itself.
        </h1>
        <p class="t-body t-secondary signin__lede">
          Ask a question in plain language. You get an answer, the document it came from,
          and the exact section it was taken from. If no policy supports an answer, this
          tool says so rather than guessing.
        </p>
        <ul class="stack stack-8 signin__facts">
          <li v-for="fact in facts" :key="fact" class="row row-8">
            <AppIcon name="check" :size="14" />
            <span class="t-caption t-secondary">{{ fact }}</span>
          </li>
        </ul>
      </div>

      <div class="signin__form-wrap">
        <form class="stack stack-16" novalidate @submit.prevent="submit">
          <div class="stack stack-6">
            <h2 class="t-title">Sign in</h2>
            <p class="t-muted">Employee accounts only. Access is granted by People Operations.</p>
          </div>

          <div class="field">
            <label class="field__label" for="email">Work email</label>
            <input
              id="email"
              v-model="email"
              class="input"
              type="email"
              autocomplete="username"
              placeholder="name@acme.co"
              required
            />
          </div>

          <div class="field">
            <label class="field__label" for="password">Password</label>
            <input
              id="password"
              v-model="password"
              class="input"
              type="password"
              autocomplete="current-password"
              required
            />
          </div>

          <p v-if="error" class="signin__error" role="alert">
            <AppIcon name="alert" :size="14" />
            <span>{{ error }}</span>
          </p>

          <button class="btn btn--pill btn--lg btn--block" type="submit" :disabled="busy">
            {{ busy ? 'Signing in…' : 'Log in' }}
          </button>

          <hr class="divider" />

          <div class="stack stack-8">
            <p class="t-label">Demo accounts — password <code class="t-mono">demo</code></p>
            <div class="row row-8 signin__accounts">
              <button
                v-for="account in accounts"
                :key="account.email"
                class="signin__account"
                type="button"
                @click="useAccount(account)"
              >
                <span class="avatar" :class="{ 'avatar--ink': account.role === 'hr' }">
                  {{ initials(account.name) }}
                </span>
                <span class="stack signin__account-text">
                  <span class="t-title">{{ account.name }}</span>
                  <span class="t-muted">
                    {{ account.role === 'hr' ? 'HR admin' : 'Employee' }}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <p class="t-muted signin__foot">
      <button class="signin__link" type="button" @click="restore">Reset demo data</button>
      · Sessions end after 12 hours of inactivity.
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { STAFF } from '../lib/seed'
import { signIn } from '../lib/store'
import { resetDemoData } from '../lib/store'
import { initials } from '../lib/format'

const route = useRoute()
const router = useRouter()

const accounts = STAFF
const facts = [
  'Every answer cites the policy section it came from.',
  'Only active policies are searched. Drafts and expired versions are excluded.',
  'Your questions are visible to People Operations so they can fill policy gaps.',
]

const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

function useAccount(account) {
  email.value = account.email
  password.value = 'demo'
  error.value = ''
}

async function submit() {
  if (!email.value || !password.value) {
    error.value = 'Enter your work email and password.'
    return
  }
  busy.value = true
  error.value = ''
  try {
    const account = await signIn(email.value, password.value)
    const fallback = account.role === 'hr' ? '/hr/documents' : '/ask'
    const next = typeof route.query.next === 'string' ? route.query.next : fallback
    router.push(next)
  } catch (err) {
    error.value = err.message
  } finally {
    busy.value = false
  }
}

function restore() {
  resetDemoData()
  email.value = ''
  password.value = ''
  error.value = ''
}
</script>

<style scoped>
.signin {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-16);
  padding: var(--spacing-20);
  background: var(--surface-conversation-canvas);
}

.signin__panel {
  width: 100%;
  max-width: var(--page-max-width);
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: var(--section-gap);
  align-items: start;
}

.signin__intro {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-16);
  padding-top: var(--spacing-16);
}

.signin__mark {
  color: var(--color-mid-ash);
}

.signin__title {
  max-width: 22ch;
}

.signin__lede {
  max-width: 56ch;
}

.signin__facts {
  color: var(--color-mid-ash);
}

.signin__form-wrap {
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-cards);
  padding: var(--card-padding);
  background: var(--surface-elevated-panel);
}

.signin__error {
  display: flex;
  align-items: flex-start;
  gap: var(--element-gap);
  margin: -4px 0;
  padding: 8px 10px;
  border: 1px solid var(--color-graphite-ink);
  border-radius: var(--radius-nav);
  background: var(--color-sidebar-mist);
  font-size: var(--text-caption);
  line-height: var(--leading-caption);
  font-weight: var(--font-weight-medium);
  color: var(--color-graphite-ink);
}

.signin__accounts {
  align-items: stretch;
}

.signin__account {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--element-gap);
  padding: 8px;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-nav);
  text-align: left;
  transition: background-color 120ms ease;
}

.signin__account:hover {
  background: var(--color-hover-veil);
}

.signin__account-text {
  min-width: 0;
}

.signin__foot {
  text-align: center;
}

.signin__link {
  color: var(--color-mid-ash);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.signin__link:hover {
  color: var(--color-graphite-ink);
}

@media (max-width: 860px) {
  .signin__panel {
    grid-template-columns: 1fr;
  }

  .signin__intro {
    padding-top: 0;
  }
}
</style>
