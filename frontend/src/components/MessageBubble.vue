<template>
  <div class="msg" :class="`msg--${message.role}`">
    <span class="avatar" :class="message.role === 'assistant' ? 'avatar--ink' : ''">
      <AppIcon v-if="message.role === 'assistant'" name="logo" :size="13" />
      <template v-else>{{ initials(userName) }}</template>
    </span>

    <div class="msg__body">
      <p class="t-label msg__role">
        {{ message.role === 'assistant' ? 'Assistant' : userName }}
      </p>

      <div v-if="isUser" class="t-body msg__text">{{ text }}</div>

      <div v-else class="stack stack-12">
        <div v-if="message.outcome === 'refused'" class="msg__refusal">
          <AppIcon name="alert" :size="14" />
          <span>No active policy supports an answer.</span>
        </div>

        <div class="t-body msg__text msg__text--answer">
          <span v-for="(paragraph, i) in paragraphs" :key="i">{{ paragraph }}</span>
          <span v-if="streaming" class="msg__caret" aria-hidden="true" />
        </div>

        <div v-if="sources.length" class="stack stack-8">
          <p class="t-label">
            {{ sources.length === 1 ? '1 source' : `${sources.length} sources` }} — cited text
          </p>
          <SourceCard v-for="(source, i) in sources" :key="i" :source="source" />
        </div>

        <div v-else-if="!streaming" class="muted-panel msg__empty">
          <p class="t-caption t-secondary">
            No policy documents were close enough to be cited.
          </p>
        </div>

        <div v-if="!streaming" class="row row-8 msg__actions">
          <button
            class="icon-btn tooltip-host"
            type="button"
            data-tip="Helpful"
            :aria-pressed="rating === 'up'"
            :aria-label="`Mark answer ${rating === 'up' ? 'not helpful' : 'helpful'}`"
            @click="rate('up')"
          >
            <AppIcon name="thumbUp" :size="15" />
          </button>
          <button
            class="icon-btn tooltip-host"
            type="button"
            data-tip="Not helpful"
            :aria-pressed="rating === 'down'"
            :aria-label="`Mark answer ${rating === 'down' ? 'not unhelpful' : 'not helpful'}`"
            @click="rate('down')"
          >
            <AppIcon name="thumbDown" :size="15" />
          </button>
          <button
            class="icon-btn tooltip-host"
            type="button"
            data-tip="Copy answer"
            aria-label="Copy answer"
            @click="copy"
          >
            <AppIcon :name="copied ? 'check' : 'copy'" :size="15" />
          </button>
          <span v-if="copied" class="t-muted">Copied</span>
          <span v-if="rating" class="t-muted">Recorded for People Operations</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import AppIcon from './AppIcon.vue'
import SourceCard from './SourceCard.vue'
import { rateMessage, session, state } from '../lib/store'
import { initials } from '../lib/format'

const props = defineProps({
  message: { type: Object, required: true },
  text: { type: String, default: '' },
  streaming: { type: Boolean, default: false },
})

const userName = computed(() => session.value?.name || 'You')
const isUser = computed(() => props.message.role === 'user')
const sources = computed(() => props.message.sources || [])
const rating = computed(() => state.ratings[props.message.id] || null)
const paragraphs = computed(() => props.text.split('\n\n').filter(Boolean))
const copied = ref(false)

function rate(value) {
  rateMessage(props.message.id, value)
}

async function copy() {
  try {
    await navigator.clipboard.writeText(props.text)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  } catch {
    copied.value = false
  }
}
</script>

<style scoped>
.msg {
  display: flex;
  gap: var(--spacing-12);
  align-items: flex-start;
}

.msg__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.msg--user .msg__text {
  white-space: pre-wrap;
}

.msg--assistant .avatar {
  margin-top: 2px;
}

.msg__role {
  color: var(--color-hollow);
}

.msg__text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.msg__text--answer {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-12);
}

.msg__caret {
  display: inline-block;
  width: 7px;
  height: 1em;
  background: var(--color-graphite-ink);
  vertical-align: text-bottom;
  animation: blink 1s steps(2, start) infinite;
}

@keyframes blink {
  to {
    visibility: hidden;
  }
}

.msg__refusal {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: var(--element-gap);
  padding: 4px 10px;
  border: 1px solid var(--color-graphite-ink);
  border-radius: var(--radius-badges);
  font-size: var(--text-caption);
  line-height: var(--leading-caption);
  font-weight: var(--font-weight-medium);
}

.msg__actions {
  color: var(--color-mid-ash);
}

.msg__actions [aria-pressed='true'] {
  background: var(--color-edge-gray);
}
</style>
