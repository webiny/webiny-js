/**
 * This file contains environment variables for all app environments.
 * It is loaded by `env-cmd` cli tool before building the React app.
 *
 * For more details on usage, see https://www.npmjs.com/package/env-cmd.
 */
module.exports = {
    default: {
        SKIP_PREFLIGHT_CHECK: true,
        INLINE_RUNTIME_CHUNK: false,
        PUBLIC_URL: "/admin",
        REACT_APP_USER_POOL_REGION: "us-east-1"
    },
    local: {
        REACT_APP_API_ENDPOINT: "[ENTER GRAPHQL API ENDPOINT URL]",
        REACT_APP_FILES_PROXY: "[ENTER API ENDPOINT URL]",
        REACT_APP_USER_POOL_ID: "[ENTER YOUR USER_POOL ID]",
        REACT_APP_USER_POOL_WEB_CLIENT_ID: "[ENTER YOUR USER_POOL APP CLIENT ID]",
        PORT: "3001"
    },
    prod: {
        REACT_APP_API_ENDPOINT: "[ENTER GRAPHQL API ENDPOINT URL]",
        REACT_APP_USER_POOL_ID: "[ENTER YOUR USER_POOL ID]",
        REACT_APP_USER_POOL_WEB_CLIENT_ID: "[ENTER YOUR USER_POOL APP CLIENT ID]",
        /**
         * NOTE: if you're using an API GATEWAY URL to access your site, make sure
         * your PUBLIC_URL includes the stage prefix.
         * E.g., `/prod/admin/` or `/dev/admin`.
         */
        PUBLIC_URL: "/admin"
    }
};
