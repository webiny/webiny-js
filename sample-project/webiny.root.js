module.exports = {
    projectName: "webiny-js",
    cli: {
        plugins: [
            require("@webiny/cli-plugin-deploy-components")({
                hooks: {
                    api: [
                        "@webiny/cwp-template-full/hooks/api",
                        "./apps/admin/webiny.config.js",
                        "./apps/site/webiny.config.js"
                    ],
                    apps: ["@webiny/cwp-template-full/hooks/apps"]
                }
            }),
            "@webiny/cli-plugin-scaffold",
            "@webiny/cli-plugin-scaffold-graphql-service",
            "@webiny/cli-plugin-scaffold-lambda"
        ]
    }
};
