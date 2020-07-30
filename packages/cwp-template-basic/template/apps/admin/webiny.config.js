const { startApp, buildApp, buildAppHandler } = require("@webiny/project-utils");
const { setEnvironmentFromState } = require("@webiny/cli-plugin-deploy-components/utils");

const map = {
    REACT_APP_USER_POOL_REGION: "${cognito.userPool.Region}",
    REACT_APP_GRAPHQL_API_URL: "${cdn.url}/graphql",
    REACT_APP_API_URL: "${cdn.url}",
    REACT_APP_USER_POOL_ID: "${cognito.userPool.Id}",
    REACT_APP_USER_POOL_WEB_CLIENT_ID: "${cognito.appClients[0].ClientId}"
};

module.exports = {
    commands: {
        async start({ env, stack, ...options }, context) {
            // Set environment variables for given project environment and stack.
            // This will load state values using the provided map and
            // populate process.env, overwriting existing values.
            await setEnvironmentFromState({ env, stack, map }, context);

            // Start local development
            await startApp(options, context);
        },
        async build({ env, stack, ...options }, context) {
            // Set environment variables for given project environment and stack.
            // This will load state values using the provided map and
            // populate process.env, overwriting existing values.
            await setEnvironmentFromState({ env, stack, map }, context);

            // Bundle app for deployment
            await buildApp(options, context);

            // Build Lambda handler which will serve files to CDN
            await buildAppHandler(options, context);
        }
    }
};
