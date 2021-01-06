const { startApp, buildApp } = require("@webiny/project-utils");
const { getStackOutput } = require("@webiny/cli-plugin-deploy-pulumi/utils");

const map = {
    REACT_APP_GRAPHQL_API_URL: "${apiUrl}/graphql",
    REACT_APP_API_URL: "${apiUrl}"
};

module.exports = {
    commands: {
        async start({ env, ...options }, context) {
            // Set environment variables for given project environment and stack.
            // This will load state values using the provided map and
            // populate process.env, overwriting existing values.
            const output = getStackOutput("api", env, map);
            Object.assign(process.env, output);

            // Start local development
            await startApp(options, context);
        },
        async build({ env, ...options }, context) {
            // Set environment variables for given project environment and stack.
            // This will load state values using the provided map and
            // populate process.env, overwriting existing values.
            const output = getStackOutput("api", env, map);
            Object.assign(process.env, output);

            // Bundle app for deployment
            await buildApp(options, context);
        }
    }
};
