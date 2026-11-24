import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { uiMessages } from '@thekestongroup/ui'
import App from './App.vue'
import './style.css'

const i18n = createI18n({ legacy: false, locale: 'en', fallbackLocale: 'en', messages: uiMessages })
createApp(App).use(i18n).mount('#app')
