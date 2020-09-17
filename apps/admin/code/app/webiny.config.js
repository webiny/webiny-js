const { startApp, buildApp } = require("@webiny/project-utils");
const { setEnvironmentFromState } = require("@webiny/cli-plugin-deploy-pulumi/utils");
const path = require("path");

const map = {
    REACT_APP_USER_POOL_REGION: "${region}",
    REACT_APP_GRAPHQL_API_URL: "//${cdnDomain}/graphql",
    REACT_APP_API_URL: "//${cdnDomain}",
    REACT_APP_USER_POOL_ID: "${cognitoUserPoolId}",
    REACT_APP_USER_POOL_WEB_CLIENT_ID: "${cognitoAppClientId}"
};

module.exports = {
    commands: {
        async start({ env, ...options }, context) {
            // Set environment variables for given project environment and stack.
            // This will load state values using the provided map and
            // populate process.env, overwriting existing values.
            await setEnvironmentFromState({ env, stack: "api", map }, context);

            // Start local development
            await startApp(options, context);
        },
        async build({ env, ...options }, context) {
            const projectRoot = context.paths.projectRoot;

            // Load .env.json from project root
            await context.loadEnv(path.resolve(projectRoot, ".env.json"), env);

            // Load .env.json from cwd (this will change depending on the folder you specified)
            await context.loadEnv(path.resolve(__dirname, ".env.json"), env);

            // Set environment variables for given project environment and stack.
            // This will load state values using the provided map and
            // populate process.env, overwriting existing values.
            await setEnvironmentFromState({ env, stack: "api", map }, context);

            // Bundle app for deployment
            await buildApp(options, context);
        }
    }
};
