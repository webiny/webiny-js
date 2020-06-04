module.exports = {
    template: "[TEMPLATE_VERSION]",
    projectName: "[PROJECT_NAME]",
    cli: {
        plugins: [
            require("@webiny/cli-plugin-deploy-components")({
                hooks: {
                    api: [
                        "@webiny/cwp-template-cms/hooks/api",
                        "./apps/admin/webiny.config.js",
                    ],
                    apps: [
                        "@webiny/cwp-template-cms/hooks/apps",
                    ]
                }
            }),
            "@webiny/cli-plugin-scaffold",
            "@webiny/cli-plugin-scaffold-graphql-service",
            "@webiny/cli-plugin-scaffold-lambda"
        ]
    }
};
