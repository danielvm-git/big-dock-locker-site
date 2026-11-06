import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { scheduleSentry } from './observability/sentry'

const app = createApp(App)

app.mount('#app')

// Sentry is deferred until the page is idle: it must never block first render.
scheduleSentry(app)
