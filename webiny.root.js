module.exports = {
    projectName: "webiny-js",
    cli: {
        plugins: [
            require("@webiny/cli-plugin-build")(),
            require("@webiny/cli-plugin-deploy-pulumi")(),
            require("@webiny/cli-plugin-deploy-pulumi")(),
            require("@webiny/api-page-builder/cli")()
        ]
    }
};
