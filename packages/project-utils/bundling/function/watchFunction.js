const fs = require("fs-extra");
const { getProject, injectHandlerTelemetry } = require("@webiny/cli/utils");

module.exports = async options => {
    const webpack = require("webpack");

    const { overrides } = options;

    // Load base webpack config
    let webpackConfig = require("./webpack.config")({
        production: false,
        ...options
    });

    // Customize Webpack config.
    if (typeof overrides.webpack === "function") {
        webpackConfig = overrides.webpack(webpackConfig);
    }

    const result = new Promise(async (resolve, reject) => {
        options.logs && console.log("Compiling...");
        return webpack(webpackConfig).watch({}, async (err, stats) => {
            if (err) {
                return reject(err);
            }

            if (!stats.hasErrors()) {
                options.logs && console.log("Compiled successfully.");
            } else {
                options.logs && console.log(stats.toString("errors-warnings"));
            }
        });
    });

    const project = getProject({ cwd });

    if (!project.config.id) {
        return result;
    }

    const handlerFile = await fs.readFile(path.join(options.cwd, "/build/handler.js"), {
        encoding: "utf8",
        flag: "r"
    });
    const includesGraphQl = handlerFile.includes("wcp-telemetry-tracker");

    if (includesGraphQl) {
        await injectHandlerTelemetry(cwd);
    }

    return result;
};
