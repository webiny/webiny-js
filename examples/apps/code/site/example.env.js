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
        /**
         * NOTE: if you're using an API GATEWAY URL to access your site, make sure
         * your PUBLIC_URL includes the stage prefix.
         * E.g., `/prod` or `/dev`.
         */
        PUBLIC_URL: "/"
    },
    local: {
        REACT_APP_API_ENDPOINT: "[ENTER GRAPHQL API ENDPOINT URL (ending with /graphql)]",
        REACT_APP_FILES_PROXY: "[ENTER API ROOT URL]",
        PORT: "3000"
    },
    prod: {
        REACT_APP_API_ENDPOINT: "[ENTER GRAPHQL API ENDPOINT URL]"
    }
};
