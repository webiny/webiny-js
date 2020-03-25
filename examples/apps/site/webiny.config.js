const { startApp, buildApp, buildAppSSR, updateEnvValues } = require("@webiny/project-utils");

module.exports = {
    hooks: {
        stateChanged: updateEnvValues(__dirname, {
            REACT_APP_GRAPHQL_API_URL: "${cdn.url}/graphql",
            REACT_APP_API_URL: "${cdn.url}",
            REACT_APP_FILES_PROXY: "${cdn.url}"
        })
    },
    commands: {
        start: startApp,
        build: buildApp,
        async buildSsr(options, context) {
            await buildApp(options, context);
            await buildAppSSR({ ...options, app: __dirname }, context);
        }
    }
};
