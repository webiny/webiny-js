module.exports = {
    projectName: "webiny-js",
    cli: {
        plugins: [
            require("@webiny/cli-plugin-workspaces")(),
            require("@webiny/cli-plugin-deploy-pulumi")(),
            require("@webiny/api-page-builder/cli")(),
            require("@webiny/cwp-template-aws/cli")(),
            require("@webiny/cli-plugin-scaffold").default(),
            require("@webiny/cli-plugin-scaffold-graphql-service").default()
        ]
    }
};
