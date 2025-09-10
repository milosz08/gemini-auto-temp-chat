import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    permissions: ['storage'],
    // required for injected css file into gemini page
    web_accessible_resources: [
      {
        resources: ['/injected-styles.css'],
        matches: ['*://*.gemini.google.com/*'],
      },
    ],
  },
});
