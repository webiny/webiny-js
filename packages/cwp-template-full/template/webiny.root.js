module.exports = {
    projectName: "webiny-js",
    cli: {
        plugins: [
            "@webiny/cli-plugin-deploy-components",
            "@webiny/cli-plugin-scaffold",
            "@webiny/cli-plugin-scaffold-graphql-service",
            "@webiny/cli-plugin-scaffold-lambda"
        ]
    }
};
