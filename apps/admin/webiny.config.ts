import { createWatchApp, createBuildApp } from "@webiny/project-utils";
const FIXED_STACK_OUTPUT = {
    REACT_APP_USER_POOL_REGION: "us-east-1",
    REACT_APP_GRAPHQL_API_URL: "https://dahuudgkaff1z.cloudfront.net/graphql",
    REACT_APP_API_URL: "https://dahuudgkaff1z.cloudfront.net",
    REACT_APP_USER_POOL_ID: "us-east-1_uL0R0fJ1q",
    REACT_APP_USER_POOL_WEB_CLIENT_ID: "10apvof2c9u5hnnnd9t0i6llen",
    REACT_APP_USER_POOL_PASSWORD_POLICY: `{ "minimumLength": 8, "requireLowercase": false, "requireNumbers": false, "requireSymbols": false, "requireUppercase": false, "temporaryPasswordValidityDays": 7 }`
};
export default {
    commands: {
        async watch(options) {
            // We use fixed values instead of reading them from a locally deployed API.
            Object.assign(process.env, FIXED_STACK_OUTPUT);
            // Starts the local development server at port 3001.
            Object.assign(process.env, { PORT: options.port || 3001 });
            const watch = createWatchApp({ cwd: __dirname });
            await watch(options);
        },
        async build(options) {
            // We use fixed values instead of reading them from a locally deployed API.
            Object.assign(process.env, FIXED_STACK_OUTPUT);
            const build = createBuildApp({ cwd: __dirname });
            await build(options);
        }
    }
};