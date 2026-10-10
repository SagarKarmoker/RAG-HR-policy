<template>
  <div class="chat">
    <div ref="scrollRef" class="chat__scroll">
      <div class="chat__inner">
        <section v-if="welcome" class="chat__welcome">
          <div class="stack stack-12 chat__welcome-text">
            <h1 class="t-heading">Ask about any HR policy.</h1>
            <p class="t-body t-secondary">
              Answers are drawn from active policy documents and always show the section
              they came from. If nothing in the policies covers your question, this will
              tell you instead of guessing.
            </p>
          </div>

          <div class="stack stack-8">
            <p class="t-label">Try one of these</p>
            <div class="row row-8 chat__starters">
              <button
                v-for="starter in starters"
                :key="starter"
                class="tag-link chat__starter"
                type="button"
                @click="ask(starter)"
              >
                {{ starter }}
              </button>
            </div>
          </div>
        </section>

        <section v-else class="stack stack-24 chat__thread">
          <header class="chat__thread-head">
            <h1 class="t-title">{{ thread?.title }}</h1>
            <p class="t-muted">
              {{ pluralise(messages.length, 'message') }} ·
              {{ formatDateTime(thread?.createdAt) }}
            </p>
          </header>

          <div
            v-for="message in messages"
            :key="message.id"
            class="chat__message"
          >
            <MessageBubble
              :message="message"
              :text="textFor(message)"
              :streaming="isStreaming(message)"
            />
          </div>

          <div v-if="busy && !streamingId" class="msg">
            <span class="avatar avatar--ink">
              <AppIcon name="logo" :size="13" />
            </span>
            <div class="stack stack-6">
              <p class="t-label">Assistant</p>
              <p class="t-body t-secondary">Reading the active policies…</p>
            </div>
          </div>
        </section>
      </div>
    </div>

    <div class="chat__composer-wrap">
      <div class="chat__composer-inner">
        <form class="composer" @submit.prevent="submit">
          <label class="sr-only" for="composer-input">Your question</label>
          <textarea
            id="composer-input"
            ref="inputRef"
            v-model="draft"
            class="composer__input"
            rows="1"
            :placeholder="placeholder"
            :disabled="busy"
            @keydown.enter.exact.prevent="submit"
            @input="grow"
          />
          <button
            class="composer__send"
            type="submit"
            :disabled="busy || !draft.trim()"
            aria-label="Send question"
          >
            <AppIcon name="arrowUp" :size="16" />
          </button>
        </form>
        <p class="t-muted chat__hint">
          Answers are generated from policy text. Check the cited section before acting on
          anything that affects you.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import MessageBubble from '../components/MessageBubble.vue'
import { askQuestion } from '../lib/api'
import {
  createThread,
  getThread,
  persist,
  renameThreadFromMessage,
} from '../lib/store'
import { formatDateTime, pluralise } from '../lib/format'

const route = useRoute()
const router = useRouter()

const starters = [
  'How many annual leave days can I carry over?',
  'What is the desk allowance for hybrid staff?',
  'When is the salary review cycle?',
  'How do I report a concern at work?',
]

const draft = ref('')
const busy = ref(false)
const streamingId = ref(null)
const revealed = ref(0)
const scrollRef = ref(null)
const inputRef = ref(null)
let timer = null

const thread = computed(() => (route.params.id ? getThread(route.params.id) : null))
const messages = computed(() => thread.value?.messages || [])
const welcome = computed(() => messages.value.length === 0)

const placeholder = computed(() =>
  thread.value?.messages.length ? 'Ask a follow-up question…' : 'Ask about any HR policy…',
)

function textFor(message) {
  if (message.role === 'user') return message.content
  if (streamingId.value === message.id) {
    return message.content.slice(0, revealed.value)
  }
  return message.content
}

function isStreaming(message) {
  return streamingId.value === message.id
}

function grow() {
  const el = inputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 200)}px`
}

async function scrollToEnd(smooth = true) {
  await nextTick()
  const el = scrollRef.value
  if (!el) return
  el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
}

function streamIn(message) {
  streamingId.value = message.id
  revealed.value = 0
  const step = Math.max(6, Math.round(message.content.length / 90))
  timer = setInterval(() => {
    revealed.value = Math.min(revealed.value + step, message.content.length)
    scrollToEnd()
    if (revealed.value >= message.content.length) {
      clearInterval(timer)
      timer = null
      streamingId.value = null
    }
  }, 16)
}

async function ask(text) {
  const question = text.trim()
  if (!question || busy.value) return

  const target = thread.value || createThread()
  draft.value = ''
  grow()
  busy.value = true

  const userMessage = {
    id: `m-${Date.now()}`,
    role: 'user',
    content: question,
    createdAt: new Date().toISOString(),
  }
  target.messages.push(userMessage)
  renameThreadFromMessage(target, userMessage)
  persist()

  if (!route.params.id) {
    router.replace({ name: 'thread', params: { id: target.id } })
  }

  scrollToEnd(false)

  try {
    const answer = await askQuestion(question)
    target.messages.push(answer)
    persist()
    await nextTick()
    scrollToEnd(false)
    streamIn(answer)
  } finally {
    busy.value = false
  }
}

function submit() {
  ask(draft.value)
}

watch(
  () => route.query.new,
  () => {
    if (route.query.new) router.replace({ name: 'ask' })
  },
)

watch(
  () => route.params.id,
  () => {
    stopStream()
    nextTick(() => scrollToEnd(false))
  },
)

function stopStream() {
  if (timer) clearInterval(timer)
  timer = null
  streamingId.value = null
  revealed.value = 0
}

onMounted(() => {
  nextTick(() => scrollToEnd(false))
  inputRef.value?.focus()
})

onUnmounted(stopStream)

defineExpose({ ask })
</script>

<style scoped>
.chat {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.chat__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.chat__inner {
  width: 100%;
  max-width: var(--reading-width);
  margin: 0 auto;
  padding: var(--section-gap) var(--spacing-16) var(--spacing-16);
}

.chat__welcome {
  min-height: 52vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--section-gap);
}

.chat__welcome-text {
  max-width: 52ch;
}

.chat__starters {
  flex-wrap: wrap;
  gap: var(--element-gap);
}

.chat__starter {
  cursor: pointer;
}

.chat__thread {
  padding-bottom: var(--spacing-10);
}

.chat__thread-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: var(--spacing-12);
  border-bottom: 1px solid var(--color-hairline);
}

.chat__message {
  padding-top: var(--spacing-20);
}

.chat__composer-wrap {
  flex: none;
  border-top: 1px solid var(--color-hairline);
  background: var(--surface-conversation-canvas);
}

.chat__composer-inner {
  width: 100%;
  max-width: var(--reading-width);
  margin: 0 auto;
  padding: var(--spacing-12) var(--spacing-16) var(--spacing-16);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.composer {
  display: flex;
  align-items: flex-end;
  gap: var(--element-gap);
  padding: 6px 6px 6px 12px;
  border: 1px solid var(--color-hairline);
  border-radius: var(--radius-cards);
  background: var(--color-pure-white);
  transition: border-color 120ms ease;
}

.composer:focus-within {
  border-color: var(--color-graphite-ink);
}

.composer__input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  resize: none;
  padding: 6px 0;
  max-height: 200px;
  font-size: var(--text-body);
  line-height: var(--leading-body);
}

.composer__input:focus {
  outline: none;
}

.composer__input::placeholder {
  color: var(--color-hollow);
}

.composer__send {
  flex: none;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-nav);
  background: var(--color-graphite-ink);
  color: var(--color-pure-white);
  transition: background-color 120ms ease, opacity 120ms ease;
}

.composer__send:hover:not(:disabled) {
  background: var(--color-ink-press);
}

.composer__send:disabled {
  background: var(--color-hover-veil);
  color: var(--color-hollow);
  cursor: not-allowed;
}

.chat__hint {
  padding-left: 2px;
}

@media (max-width: 820px) {
  .chat__inner,
  .chat__composer-inner {
    padding-left: 56px;
    padding-right: var(--spacing-12);
  }
}
</style>
