module.exports = {
    projectName: "webiny-js/dynamic-pages",
    cli: {
        plugins: [
            require("@webiny/cli-plugin-workspaces")(),
            require("@webiny/cli-plugin-deploy-pulumi")(),
            require("@webiny/api-page-builder/cli")(),
            require("@webiny/cwp-template-aws/cli")(),
            require("./plugins/cli-plugin-generate-tsconfigs")(),
            require("@webiny/cli-plugin-scaffold").default(),
            require("@webiny/cli-plugin-scaffold-graphql-service").default(),
            require("@webiny/cli-plugin-scaffold-admin-app-module").default()
        ]
    }
};
