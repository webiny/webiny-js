const { startApp, buildApp, buildAppHandler } = require("@webiny/project-utils");
const { updateEnvValues } = require("@webiny/cli-plugin-deploy-components/utils");

module.exports = {
    hooks: {
        afterDeploy: updateEnvValues(__dirname, {
            REACT_APP_USER_POOL_REGION: "${cognito.userPool.Region}",
            REACT_APP_GRAPHQL_API_URL: "${cdn.url}/graphql",
            REACT_APP_API_URL: "${cdn.url}",
            REACT_APP_USER_POOL_ID: "${cognito.userPool.Id}",
            REACT_APP_USER_POOL_WEB_CLIENT_ID: "${cognito.appClients[0].ClientId}"
        })
    },
    commands: {
        async start(...args) {
            // Start local development
            await startApp(...args);
        },
        async build(...args) {
            // Bundle app for deployment
            await buildApp(...args);
            // Build Lambda handler which will serve files to CDN
            await buildAppHandler(...args);
        }
    }
};
