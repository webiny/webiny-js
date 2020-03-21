const path = require("path");
const fs = require("fs-extra");

module.exports = yargs => {
    yargs.usage("usage: $0 start").command("start", "Start development build", async () => {
        if (!process.env.NODE_ENV) {
            process.env.NODE_ENV = "development";
        }
        process.env.BABEL_ENV = process.env.NODE_ENV;

        const webinyConfig = path.resolve("webiny.config.js");
        if (fs.existsSync(webinyConfig)) {
            const config = require(webinyConfig);
            if (config.webpack) {
                return await config.webpack();
            }
        }

        const createAppWebpackConfig = require("../webpack/createAppWebpackConfig");
        const { execute, webpackConfig } = await createAppWebpackConfig();
        await execute(webpackConfig);
    });
};
