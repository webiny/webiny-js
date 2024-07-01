const formatWebpackMessages = require("react-dev-utils/formatWebpackMessages");
const chalk = require("chalk");
const path = require("path");
const { getProjectApplication } = require("@webiny/cli/utils");

module.exports = async options => {
    const { cwd, logs } = options;

    logs && console.log(`Compiling ${chalk.green(path.basename(cwd))}...`);

    let projectApplication;
    try {
        projectApplication = getProjectApplication({ cwd });
    } catch {
        // No need to do anything.
    }

    // Common Webpack config factory params.
    const wpConfig = {
        production: false,
        projectApplication,
        ...options
    };

    // Build vendors DLL
    const dllConfig = await require("./webpack.dll.config")(wpConfig);
    await buildConfig(dllConfig, options);

    // Build handler
    const handlerConfig = require("./webpack.config")(wpConfig);

    await buildConfig(applyOverrides(handlerConfig, options), options);
};

function applyOverrides(webpackConfig, options) {
    const { overrides } = options;

    // Customize Webpack config.
    if (typeof overrides.webpack === "function") {
        return overrides.webpack(webpackConfig);
    }
    return webpackConfig;
}

function buildConfig(config, options) {
    const webpack = require("webpack");
    return new Promise(async (resolve, reject) => {
        return webpack(config).run(async (err, stats) => {
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

            options.logs && console.log(`Compiled successfully.`);
            resolve();
        });
    });
}
