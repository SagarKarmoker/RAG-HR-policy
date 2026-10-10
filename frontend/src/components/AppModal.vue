<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="scrim" @click.self="$emit('close')">
        <div
          class="modal"
          :class="{ 'modal--wide': wide }"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          @keydown.esc="$emit('close')"
        >
          <div class="modal__head">
            <div class="stack-6">
              <h2 class="t-title">{{ title }}</h2>
              <p v-if="description" class="t-muted">{{ description }}</p>
            </div>
            <AppIconButton icon="close" tip="Close" label="Close" @click="$emit('close')" />
          </div>
          <div class="modal__body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="modal__foot">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import AppIconButton from './AppIconButton.vue'

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  wide: { type: Boolean, default: false },
})

defineEmits(['close'])
</script>
