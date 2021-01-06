const { startApp, buildApp } = require("@webiny/project-utils");
const { getStackOutput } = require("@webiny/cli-plugin-deploy-pulumi/utils");
require("dotenv").config();

const map = {
    REACT_APP_USER_POOL_REGION: "${region}",
    REACT_APP_GRAPHQL_API_URL: "${apiUrl}/graphql",
    REACT_APP_API_URL: "${apiUrl}",
    REACT_APP_USER_POOL_ID: "${cognitoUserPoolId}",
    REACT_APP_USER_POOL_WEB_CLIENT_ID: "${cognitoAppClientId}"
};

module.exports = {
    commands: {
        async start({ env, ...options }, context) {
            // Set environment variables for given project environment and stack.
            // This will load state values using the provided map and
            // populate process.env, overwriting existing values.
            const output = await getStackOutput("api", env, map);
            Object.assign(process.env, output);

            // Start local development
            await startApp({ ...options, openBrowser: false }, context);
        },
        async build({ env, ...options }, context) {
            // Set environment variables for given project environment and stack.
            // This will load state values using the provided map and
            // populate process.env, overwriting existing values.
            const output = await getStackOutput("api", env, map);
            Object.assign(process.env, output);

            // Bundle app for deployment
            await buildApp(options, context);
        }
    }
};
