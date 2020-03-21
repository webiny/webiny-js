const path = require("path");
const fs = require("fs-extra");

module.exports = yargs => {
    yargs.usage("usage: $0 build").command("build", "Build app", async ({ argv }) => {
        // Do this as the first thing so that any code reading it knows the right env.
        if (!process.env.NODE_ENV) {
            process.env.NODE_ENV = "production";
        }
        process.env.BABEL_ENV = process.env.NODE_ENV;

        const webinyConfig = path.resolve("webiny.config.js");
        if (fs.existsSync(webinyConfig)) {
            const config = require(webinyConfig);
            if (typeof config.webpack === "function") {
                return await config.webpack(argv);
            }
        }

        throw Error(`"webpack" configuration is missing in your "webiny.config.js" file.`);
    });
};
