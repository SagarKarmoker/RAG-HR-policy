<template>
  <div class="conv">
    <RouterLink :to="`/ask/${thread.id}`" class="conv__card">
      <span class="conv__title">{{ displayTitle }}</span>
      <span class="conv__preview">{{ preview }}</span>
    </RouterLink>
    <AppIconButton
      class="conv__delete"
      icon="trash"
      tip="Delete thread"
      :label="`Delete thread ${displayTitle}`"
      @click="confirmDelete = true"
    />

    <AppModal
      :open="confirmDelete"
      title="Delete this thread?"
      :description="displayTitle"
      @close="confirmDelete = false"
    >
      <p class="t-caption t-secondary">
        The questions and answers in this thread are removed for you. Answers given to
        other employees are unaffected, and no policy document is changed.
      </p>
      <template #footer>
        <AppButton variant="veil" @click="confirmDelete = false">Keep thread</AppButton>
        <AppButton variant="ink" icon="trash" @click="remove">Delete thread</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppIconButton from './AppIconButton.vue'
import AppButton from './AppButton.vue'
import AppModal from './AppModal.vue'
import { deleteThread } from '../lib/store'

const props = defineProps({ thread: { type: Object, required: true } })
const emit = defineEmits(['deleted'])

const confirmDelete = ref(false)

const lastMessage = computed(() => props.thread.messages[props.thread.messages.length - 1])

const displayTitle = computed(
  () => props.thread.title === 'New question' ? 'Untitled question' : props.thread.title,
)

const preview = computed(() => {
  const message = lastMessage.value
  if (!message) return 'No messages yet'
  const text = message.role === 'user' ? message.content : message.content
  return text.length > 72 ? `${text.slice(0, 72)}…` : text
})

function remove() {
  deleteThread(props.thread.id)
  confirmDelete.value = false
  emit('deleted')
}
</script>

<style scoped>
.conv {
  position: relative;
}

.conv__card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 10px;
  border-radius: var(--radius-nav);
  transition: background-color 120ms ease;
}

.conv__card:hover {
  background: var(--color-hover-veil);
}

.conv__card.router-link-active {
  background: var(--color-hover-veil);
}

.conv__title {
  font-size: var(--text-caption);
  font-weight: var(--font-weight-medium);
  color: var(--color-graphite-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 24px;
}

.conv__preview {
  font-size: 13px;
  line-height: 1.4;
  color: var(--color-hollow);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv__delete {
  position: absolute;
  top: 5px;
  right: 4px;
  opacity: 0;
  transition: opacity 120ms ease;
}

.conv:hover .conv__delete,
.conv__delete:focus-visible {
  opacity: 1;
}
</style>
