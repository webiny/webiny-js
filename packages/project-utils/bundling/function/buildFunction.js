const formatWebpackMessages = require("react-dev-utils/formatWebpackMessages");
const { getDuration } = require("../../utils");
const chalk = require("chalk");
const fs = require("fs-extra");
const { getProject } = require("@webiny/cli/utils");
const { injectHandlerTelemetry } = require("./telemetry");

module.exports = async options => {
    const duration = getDuration();
    const path = require("path");

    const { overrides, logs, cwd } = options;

    logs && console.log(`Compiling ${chalk.green(path.basename(cwd))}...`);

    let webpackConfig = require("./webpack.config")({
        production: true,
        ...options
    });

    // Customize Webpack config.
    if (typeof overrides.webpack === "function") {
        webpackConfig = overrides.webpack(webpackConfig);
    }

    const webpack = require("webpack");
    const result = await new Promise(async (resolve, reject) => {
        return webpack(webpackConfig).run(async (err, stats) => {
            let messages = {};

            if (err) {
                messages = formatWebpackMessages({
                    errors: [err.message],
                    warnings: []
                });

                console.error(messages.errors.join("\n\n"));
                return reject();
            }

            if (stats.hasErrors()) {
                messages = formatWebpackMessages(
                    stats.toJson({
                        all: false,
                        warnings: true,
                        errors: true
                    })
                );
            }

            if (Array.isArray(messages.errors) && messages.errors.length) {
                // Only keep the first error. Others are often indicative
                // of the same problem, but confuse the reader with noise.
                if (messages.errors.length > 1) {
                    messages.errors.length = 1;
                }

                console.error(messages.errors.join("\n\n"));
                return reject();
            }

            logs && console.log(`Compiled successfully in ${chalk.green(duration()) + "s"}.`);
            resolve();
        });
    });

    // We only enable WCP-related functionality if the WCP_APP_URL and WCP_API_URL
    // environment variables are present in runtime. Otherwise we exit.
    const experimentalWcpFeaturesEnabled = process.env.WCP_APP_URL && process.env.WCP_API_URL;
    if (!experimentalWcpFeaturesEnabled) {
        return result;
    }

    const project = getProject({ cwd });

    if (!project.config.id) {
        return result;
    }

    const handlerFile = await fs.readFile(path.join(options.cwd, "build", "handler.js"), {
        encoding: "utf8",
        flag: "r"
    });

    const isTracked = handlerFile.includes("wcp-telemetry-tracker");
    if (isTracked) {
        await injectHandlerTelemetry(cwd);
    }

    return result;
};
