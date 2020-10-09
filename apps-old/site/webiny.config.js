const {
    startApp,
    buildApp,
    buildAppHandlerWithSSR,
    buildAppSSR
} = require("@webiny/project-utils");

const { setEnvironmentFromState } = require("@webiny/cli-plugin-deploy-components/utils");

const map = {
    REACT_APP_GRAPHQL_API_URL: "${cdn.url}/graphql",
    REACT_APP_API_URL: "${cdn.url}"
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
            await buildAppHandlerWithSSR(options, context);
        },
        async buildSsr({ env, stack, ...options }, context) {
            // Set environment variables for given project environment and stack.
            // This will load state values using the provided map and
            // populate process.env, overwriting existing values.
            await setEnvironmentFromState({ env, stack, map }, context);

            // Build app for deployment
            await buildApp(options, context);

            // Build SSR bundle using app build output
            await buildAppSSR({ ...options, app: __dirname }, context);
        }
    }
};
