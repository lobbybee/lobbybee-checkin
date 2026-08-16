// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      // Override with NUXT_PUBLIC_API_HOST. Endpoints live under {apiHost}/api/chat/web-checkin/<token>/
      apiHost: 'http://localhost:8000'
    }
  },

  app: {
    head: {
      title: 'Lobbybee Hotel — Check-in',
      charset: 'utf-8',
      // No maximum-scale/user-scalable=no — pinch-zoom must stay available (a11y).
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'description', content: 'Complete your hotel check-in — guest details and ID documents.' },
        { name: 'theme-color', content: '#FBF5EC' },
        { name: 'color-scheme', content: 'light' },
        // Stops iOS from turning ID/document numbers into tap-to-call links.
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'robots', content: 'noindex, nofollow' }
      ]
    }
  },

  modules: [
    '@nuxt/a11y',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image'
  ]
})