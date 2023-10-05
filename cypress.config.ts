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
        WEBSITE_URL: "https://d2q6pwg9zdj3nn.cloudfront.net",
        WEBSITE_PREVIEW_URL: "https://d25f6w4sa95og.cloudfront.net",
        ADMIN_URL: "https://d1w69umaxh8miv.cloudfront.net/admin",
        API_URL: "https://d2p99tgwwksqtg.cloudfront.net",
        GRAPHQL_API_URL: "https://d2p99tgwwksqtg.cloudfront.net/graphql",
        CMS_MANAGE_GRAPHQL_API_URL: "https://d2p99tgwwksqtg.cloudfront.net/cms/manage",
        AUTHORIZATION_TOKEN_KEY: "webiny-token",
        AWS_COGNITO_USER_POOL_ID: "us-east-1_W0udA0Xo1",
        AWS_COGNITO_CLIENT_ID: "33nh25utef5h563niu6sgq3852",
        DEFAULT_ADMIN_USER_USERNAME: "admin@webiny.com",
        DEFAULT_ADMIN_USER_PASSWORD: "12345678",
        DEFAULT_ADMIN_USER_FIRST_NAME: "admin-first-name",
        DEFAULT_ADMIN_USER_LAST_NAME: "admin-last-name"
    },
    e2e: {
        specPattern: "cypress/integration/**/*.cy.{js,jsx,ts,tsx}",
        // We've imported your old cypress plugins here.
        // You may want to clean this up later by importing these.
        setupNodeEvents(on, config) {
            return require("./cypress/plugins/index.js")(on, config);
        },
        baseUrl: "https://d1w69umaxh8miv.cloudfront.net"
    }
});
