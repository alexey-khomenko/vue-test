import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Tasks',
    component: () => import('@/views/Tasks.vue'),
  },
  {
    path: '/task/:id',
    name: 'Task',
    component: () => import('@/views/Task.vue'),
  },
  {
    path: '/create',
    name: 'Create',
    component: () => import('@/views/Create.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
