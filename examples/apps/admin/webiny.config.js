const { startApp, buildApp, updateEnvValues } = require("@webiny/project-utils");

module.exports = {
    hooks: {
        stateChanged: updateEnvValues(__dirname, {
            REACT_APP_USER_POOL_REGION: "${cognito.userPool.Region}",
            REACT_APP_GRAPHQL_API_URL: "${cdn.url}/graphql",
            REACT_APP_API_URL: "${cdn.url}",
            REACT_APP_FILES_PROXY: "${cdn.url}",
            REACT_APP_USER_POOL_ID: "${cognito.userPool.Id}",
            REACT_APP_USER_POOL_WEB_CLIENT_ID: "${cognito.appClients[0].ClientId}"
        })
    },
    commands: {
        start: startApp,
        build: buildApp
    }
};
