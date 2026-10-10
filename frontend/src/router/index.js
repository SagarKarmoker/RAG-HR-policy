import { createRouter, createWebHistory } from 'vue-router'
import { isSignedIn, isHr } from '../lib/store'

const routes = [
  { path: '/', redirect: '/ask' },
  {
    path: '/sign-in',
    name: 'sign-in',
    component: () => import('../views/SignInView.vue'),
    meta: { public: true, chrome: 'bare' },
  },
  {
    path: '/ask',
    name: 'ask',
    component: () => import('../views/ChatView.vue'),
    meta: { thread: true },
  },
  {
    path: '/ask/:id',
    name: 'thread',
    component: () => import('../views/ChatView.vue'),
    meta: { thread: true },
  },
  {
    path: '/library',
    name: 'library',
    component: () => import('../views/LibraryView.vue'),
  },
  {
    path: '/library/:id',
    name: 'document',
    component: () => import('../views/DocumentView.vue'),
  },
  { path: '/hr', redirect: '/hr/documents' },
  {
    path: '/hr/documents',
    name: 'hr-documents',
    component: () => import('../views/hr/DocumentsView.vue'),
    meta: { hr: true },
  },
  {
    path: '/hr/documents/:id',
    name: 'hr-document',
    component: () => import('../views/hr/DocumentEditView.vue'),
    meta: { hr: true },
  },
  {
    path: '/hr/upload',
    name: 'hr-upload',
    component: () => import('../views/hr/UploadView.vue'),
    meta: { hr: true },
  },
  {
    path: '/hr/questions',
    name: 'hr-questions',
    component: () => import('../views/hr/QuestionsView.vue'),
    meta: { hr: true },
  },
  {
    path: '/hr/gaps',
    name: 'hr-gaps',
    component: () => import('../views/hr/GapsView.vue'),
    meta: { hr: true },
  },
  { path: '/:pathMatch(.*)*', redirect: '/ask' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  if (to.meta.public) {
    return isSignedIn.value && to.name === 'sign-in' ? { name: 'ask' } : true
  }
  if (!isSignedIn.value) {
    return { name: 'sign-in', query: to.fullPath !== '/' ? { next: to.fullPath } : {} }
  }
  if (to.meta.hr && !isHr.value) {
    return { name: 'ask' }
  }
  return true
})

export default router
