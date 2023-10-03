import { defineConfig } from "cypress";

export default defineConfig({
    viewportWidth: 1600,
    viewportHeight: 1200,
    defaultCommandTimeout: 30000,
    video: false,
    retries: {
        runMode: 5,
        openMode: 0
    },
    env: {
        WEBSITE_NAME: "Cypress Test Website",
        WEBSITE_URL: "https://d1zrqipbn4zprn.cloudfront.net",
        ADMIN_URL: "https://d3stqa6lsyg9y5.cloudfront.net",
        API_URL: "https://de5xdg3o48kr0.cloudfront.net",
        GRAPHQL_API_URL: "https://de5xdg3o48kr0.cloudfront.net/graphql",
        AUTHORIZATION_TOKEN_KEY: "webiny-token",
        AWS_COGNITO_USER_POOL_ID: "us-east-1_0wx20vU7v",
        AWS_COGNITO_CLIENT_ID: "vl47d4btt2j58lcart7j8mvij",
        DEFAULT_ADMIN_USER_USERNAME: "admin@webiny.com",
        DEFAULT_ADMIN_USER_PASSWORD: "12345678",
        DEFAULT_ADMIN_USER_FIRST_NAME: "admin-first-name",
        DEFAULT_ADMIN_USER_LAST_NAME: "admin-last-name",
        CMS_MANAGE_GRAPHQL_API_URL: "https://de5xdg3o48kr0.cloudfront.net/cms/manage",
        failOnSnapshotDiff: false,
        WEBSITE_PREVIEW_URL: "https://dgyvom14crvwi.cloudfront.net"
    },
    e2e: {
        specPattern: "cypress/integration/**/*.cy.{js,jsx,ts,tsx}",
        // We've imported your old cypress plugins here.
        // You may want to clean this up later by importing these.
        setupNodeEvents(on, config) {
            return require("./cypress/plugins/index.js")(on, config);
        },
        baseUrl: "https://d3stqa6lsyg9y5.cloudfront.net"
    }
});
