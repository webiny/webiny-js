const {
    startApp,
    buildApp,
    buildAppHandler,
    buildAppSSR,
    updateEnvValues
} = require("@webiny/project-utils");

module.exports = {
    hooks: {
        stateChanged: updateEnvValues(__dirname, {
            REACT_APP_GRAPHQL_API_URL: "${cdn.url}/graphql",
            REACT_APP_API_URL: "${cdn.url}",
            REACT_APP_FILES_PROXY: "${cdn.url}"
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
        },
        async buildSsr(options, context) {
            // Build app for deployment
            await buildApp(options, context);
            // Build SSR bundle using app build output
            await buildAppSSR({ ...options, app: __dirname }, context);
        }
    }
};
