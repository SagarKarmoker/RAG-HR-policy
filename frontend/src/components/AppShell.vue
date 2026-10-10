<template>
  <div class="shell">
    <div v-if="navOpen" class="shell__scrim" @click="navOpen = false" />

    <aside class="shell__sidebar" :class="{ 'shell__sidebar--open': navOpen }">
      <div class="shell__top">
        <button class="shell__brand" type="button" @click="goHome">
          <AppIcon name="logo" :size="18" />
          <span class="shell__brand-text">Policy Assistant</span>
        </button>
        <AppIconButton
          class="shell__close"
          icon="close"
          tip="Close menu"
          label="Close menu"
          @click="navOpen = false"
        />
      </div>

      <div class="shell__body">
        <nav class="stack-6" aria-label="Primary">
          <SideLink
            v-for="item in primaryLinks"
            :key="item.to"
            :to="item.to"
            :icon="item.icon"
          >
            {{ item.label }}
          </SideLink>
        </nav>

        <template v-if="isHr">
          <hr class="divider shell__rule" />
          <nav class="stack-6" aria-label="Policy administration">
            <p class="t-label shell__label">Admin</p>
            <SideLink
              v-for="item in hrLinks"
              :key="item.to"
              :to="item.to"
              :icon="item.icon"
            >
              {{ item.label }}
            </SideLink>
          </nav>
        </template>

        <template v-else>
          <hr class="divider shell__rule" />
          <div class="stack stack-6">
            <div class="row row--between">
              <p class="t-label">Recent</p>
              <AppIconButton
                icon="plus"
                tip="New question"
                label="New question"
                @click="newThread"
              />
            </div>
            <ul class="stack stack-6">
              <li v-for="thread in recentThreads" :key="thread.id">
                <ConversationRow :thread="thread" @deleted="navOpen = false" />
              </li>
              <li v-if="!recentThreads.length" class="t-muted shell__empty">
                Your previous questions appear here.
              </li>
            </ul>
          </div>
        </template>
      </div>

      <div class="shell__foot">
        <p class="t-muted">
          {{
            isHr
              ? 'Answers are generated from active policy documents only.'
              : 'Answers come from active policy documents and show the source.'
          }}
        </p>
        <div class="row row-8 shell__account">
          <span class="avatar" :class="{ 'avatar--ink': isHr }">
            {{ initials(session?.name) }}
          </span>
          <div class="stack shell__account-text">
            <span class="t-title shell__account-name">{{ session?.name }}</span>
            <span class="t-muted">{{ isHr ? 'People Operations' : session?.team }}</span>
          </div>
          <AppButton
            class="shell__signout"
            variant="pill"
            icon="logout"
            @click="handleSignOut"
          >
            Sign out
          </AppButton>
        </div>
      </div>
    </aside>

    <div class="shell__main">
      <AppIconButton
        class="shell__menu"
        icon="menu"
        tip="Menu"
        label="Open menu"
        @click="navOpen = true"
      />
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from './AppIcon.vue'
import AppIconButton from './AppIconButton.vue'
import AppButton from './AppButton.vue'
import SideLink from './SideLink.vue'
import ConversationRow from './ConversationRow.vue'
import { isHr, session, threads, signOut, createThread } from '../lib/store'
import { initials } from '../lib/format'

const route = useRoute()
const router = useRouter()
const navOpen = ref(false)

const primaryLinks = computed(() =>
  isHr.value
    ? [{ to: '/ask', icon: 'chat', label: 'Ask a policy question' }]
    : [
        { to: '/ask', icon: 'chat', label: 'Ask' },
        { to: '/library', icon: 'book', label: 'Policies' },
      ],
)

const hrLinks = [
  { to: '/hr/documents', icon: 'folder', label: 'Documents' },
  { to: '/hr/upload', icon: 'upload', label: 'Upload policy' },
  { to: '/hr/questions', icon: 'users', label: 'Question log' },
  { to: '/hr/gaps', icon: 'search', label: 'Content gaps' },
]

const recentThreads = computed(() => threads.value.slice(0, 14))

watch(() => route.fullPath, () => { navOpen.value = false })

function goHome() {
  router.push(isHr.value ? '/hr/documents' : '/ask')
}

function newThread() {
  router.push({ name: 'ask', query: { new: '1' } })
}

function handleSignOut() {
  signOut()
  router.push({ name: 'sign-in' })
}
</script>

<style scoped>
.shell {
  display: flex;
  height: 100%;
  background: var(--surface-conversation-canvas);
}

.shell__scrim {
  display: none;
}

.shell__sidebar {
  width: var(--sidebar-width);
  flex: none;
  display: flex;
  flex-direction: column;
  background: var(--surface-sidebar-canvas);
  border-right: 1px solid var(--color-hairline);
}

.shell__top {
  height: var(--header-height);
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--element-gap);
  padding: 0 var(--spacing-12);
}

.shell__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--element-gap);
  border-radius: var(--radius-nav);
  padding: 6px 8px;
  margin-left: -8px;
  color: var(--color-graphite-ink);
}

.shell__brand:hover {
  background: var(--color-hover-veil);
}

.shell__brand-text {
  font-size: var(--text-caption);
  font-weight: var(--font-weight-medium);
}

.shell__close {
  display: none;
}

.shell__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--spacing-6) var(--spacing-8) var(--spacing-16);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-12);
}

.shell__rule {
  margin: 4px 0;
}

.shell__label {
  padding: 0 10px 2px;
}

.shell__empty {
  padding: 2px 10px;
}

.shell__foot {
  flex: none;
  padding: var(--spacing-12);
  border-top: 1px solid var(--color-hairline);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-10);
}

.shell__account {
  flex-wrap: wrap;
}

.shell__account-text {
  min-width: 0;
  flex: 1;
}

.shell__account-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shell__signout {
  width: 100%;
}

.shell__main {
  flex: 1;
  min-width: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--surface-conversation-canvas);
}

.shell__menu {
  display: none;
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 20;
}

@media (max-width: 820px) {
  .shell__sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 90;
    transform: translateX(-100%);
    transition: transform 180ms ease;
  }

  .shell__sidebar--open {
    transform: translateX(0);
  }

  .shell__scrim {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 85;
    background: var(--color-deep-charcoal);
  }

  .shell__close,
  .shell__menu {
    display: inline-flex;
  }
}
</style>
