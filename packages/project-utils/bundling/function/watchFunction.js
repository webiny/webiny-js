const WebpackBar = require("webpackbar");
const { getProjectApplication } = require("@webiny/cli/utils");

module.exports = async options => {
    if (!options) {
        options = {};
    }
    if (!options.cwd) {
        options.cwd = process.cwd();
    }
    const webpack = require("webpack");

    const { overrides, cwd } = options;

    let projectApplication;
    try {
        projectApplication = getProjectApplication({ cwd });
    } catch {
        // No need to do anything.
    }

    // Load base webpack config
    let webpackConfig = require("./webpack.config")({
        production: false,
        projectApplication,
        ...options
    });

    // Customize Webpack config.
    if (typeof overrides.webpack === "function") {
        webpackConfig = overrides.webpack(webpackConfig);
    }

    // We remove the WebpackBar plugin, as it's not needed in watch mode.
    const webpackBarPluginIndex  = webpackConfig.plugins.findIndex(plugin => plugin instanceof WebpackBar);
    const usesWebpackBar = webpackBarPluginIndex > -1;
    if (usesWebpackBar) {
        webpackConfig.plugins.splice(webpackBarPluginIndex, 1);
    }

    return new Promise(async (resolve, reject) => {
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
};
