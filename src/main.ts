import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './style.css'

createApp(App).use(router).mount('#app')

// Wait for the initial route so direct links record the correct page URL.
void router.isReady().then(() => {
  if (!import.meta.env.PROD || !import.meta.env.VITE_UMAMI_WEBSITE_ID) return

  const script = document.createElement('script')
  script.src = import.meta.env.VITE_UMAMI_SCRIPT_URL || 'https://cloud.umami.is/script.js'
  script.async = true
  script.dataset.websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID
  script.dataset.excludeSearch = 'true'
  script.dataset.excludeHash = 'true'
  document.head.appendChild(script)
})
