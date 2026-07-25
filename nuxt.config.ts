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
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover'
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