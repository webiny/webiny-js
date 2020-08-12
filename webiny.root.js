module.exports = {
    projectName: "webiny-js",
    cli: {
        plugins: [
            require("@webiny/cli-plugin-deploy-components")(),
            require("@webiny/cwp-template-full/hooks/api")(),
            require("@webiny/cwp-template-full/hooks/apps")(),
            require("@webiny/cli-plugin-scaffold"),
            require("@webiny/cli-plugin-scaffold-graphql-service"),
            require("@webiny/cli-plugin-scaffold-lambda"),
            require("@webiny/cli-plugin-scaffold-admin-app-module"),
            require("@webiny/cli-plugin-scaffold-node-package"),
            require("@webiny/cli-plugin-scaffold-react-package"),
            require("@webiny/cli-plugin-scaffold-react-app")
        ]
    }
};
