import { createApp } from 'vue'
import * as Sentry from '@sentry/vue'
import './style.css'
import App from './App.vue'

const app = createApp(App)

Sentry.init({
  app,
  dsn: 'https://6c4c063396e924e672faa745554e17c1@o4511429219450880.ingest.us.sentry.io/4511429223251968',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ['localhost', /^https:\/\/bigdocklocker\.netlify\.app/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  sendDefaultPii: false,
  enableLogs: true,
})

app.mount('#app')
