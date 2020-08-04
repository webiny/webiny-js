module.exports = {
    template: "[TEMPLATE_VERSION]",
    projectName: "[PROJECT_NAME]",
    cli: {
        plugins: [
            require("@webiny/cli-plugin-deploy-components")(),
            require("@webiny/cwp-template-admin/hooks/api")(),
            require("@webiny/cwp-template-admin/hooks/apps")(),
            require("@webiny/cli-plugin-scaffold"),
            require("@webiny/cli-plugin-scaffold-graphql-service"),
            require("@webiny/cli-plugin-scaffold-lambda")
        ]
    }
};
