const fs = require("fs-extra");
const { getProject } = require("@webiny/cli/utils");
const { injectHandlerTelemetry } = require("./utils");

module.exports = async options => {
    if (!options) {
        options = {};
    }
    if (!options.cwd) {
        options.cwd = process.cwd();
    }
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

    // We only enable WCP-related functionality if the WCP_APP_URL and WCP_API_URL
    // environment variables are present in runtime. Otherwise we exit.
    const experimentalWcpFeaturesEnabled = process.env.WCP_APP_URL && process.env.WCP_API_URL;
    if (!experimentalWcpFeaturesEnabled) {
        return result;
    }

    // TODO: this needs to be reviewed. At the moment, the Lambda function code
    // TODO: will be deployed twice - once Webpack has completed its bundling
    // TODO: and also once the following code modified the generated bundle.
    const project = getProject({
        cwd: options.cwd
    });

    if (!project.config.id) {
        return result;
    }

    const handlerFile = await fs.readFile(path.join(options.cwd, "/build/handler.js"), {
        encoding: "utf8",
        flag: "r"
    });
    const includesGraphQl = handlerFile.includes("wcp-telemetry-tracker");

    if (includesGraphQl) {
        await injectHandlerTelemetry(options.cwd);
    }

    return result;
};
