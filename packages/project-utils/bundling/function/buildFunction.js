const formatWebpackMessages = require("react-dev-utils/formatWebpackMessages");
const { getDuration } = require("../../utils");
const chalk = require("chalk");
const { getProjectApplication } = require("@webiny/cli/utils");

module.exports = async options => {
    const duration = getDuration();
    const path = require("path");

    const { overrides, logs, cwd, debug } = options;

    let projectApplication;
    try {
        projectApplication = getProjectApplication({ cwd });
    } catch {
        // No need to do anything.
    }

    logs && console.log(`Compiling ${chalk.green(path.basename(cwd))}...`);

    let webpackConfig = require("./webpack.config")({
        production: !debug,
        projectApplication,
        ...options
    });

    // Customize Webpack config.
    if (typeof overrides.webpack === "function") {
        webpackConfig = overrides.webpack(webpackConfig);
    }

    const webpack = require("webpack");

    return new Promise(async (resolve, reject) => {
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
};
