import { createRouter, createWebHistory } from 'vue-router'
import BackToBatukSection from '@/components/BackToBatukSection.vue'
import HomeSection from '@/components/HomeSection.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomeSection },
    { path: '/back-to-batuk/:groupId?', component: BackToBatukSection },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
