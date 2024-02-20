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
        WEBSITE_URL: "{WEBSITE_URL}",
        WEBSITE_PREVIEW_URL: "{WEBSITE_PREVIEW_URL}",
        ADMIN_URL: "{ADMIN_URL}",
        API_URL: "{API_URL}",
        GRAPHQL_API_URL: "{API_URL}/graphql",
        CMS_MANAGE_GRAPHQL_API_URL: "{API_URL}/cms/manage",
        AUTHORIZATION_TOKEN_KEY: "webiny-token",
        AWS_COGNITO_USER_POOL_ID: "{AWS_COGNITO_USER_POOL_ID}",
        AWS_COGNITO_CLIENT_ID: "{AWS_COGNITO_CLIENT_ID}",
        DEFAULT_ADMIN_USER_USERNAME: "admin@webiny.com",
        DEFAULT_ADMIN_USER_PASSWORD: "12345678",
        DEFAULT_ADMIN_USER_FIRST_NAME: "admin-first-name",
        DEFAULT_ADMIN_USER_LAST_NAME: "admin-last-name",

        /* https://github.com/jaredpalmer/cypress-image-snapshot#preventing-failures */
        failOnSnapshotDiff: false
    },
    e2e: {
        baseUrl: "{ADMIN_URL}"
    }
});
