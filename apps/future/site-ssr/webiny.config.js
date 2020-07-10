const { updateEnvValues, buildAppSSRFromSource } = require("@webiny/project-utils");

module.exports = {
    hooks: {
        afterDeploy: updateEnvValues(__dirname, {
            REACT_APP_GRAPHQL_API_URL: "${cdn.url}/graphql",
            REACT_APP_API_URL: "${cdn.url}"
        })
    },
    commands: {
        /**
         * This is an example of building SSR using custom renderer and handler.
         */
        async build(options, context) {
            const buildConfig = {
                ...options,
                handler: "./src/handler.js",
                renderer: "./src/renderer.js",
                output: {
                    path: "build"
                }
            };

            await buildAppSSRFromSource(buildConfig, context);
        }
    }
};
