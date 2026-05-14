const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: 'torr8x',
  allowCypressEnv: false,

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
