module.exports = {
    projectName: "webiny-js",
    cli: {
        plugins: [
            require("@webiny/cli-plugin-build")(),
            require("@webiny/cli-plugin-deploy-pulumi")()
        ]
    }
};
