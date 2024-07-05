const { getProjectApplication } = require("@webiny/cli/utils");
const fs = require("fs");

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

    if (!fs.existsSync(webpackConfig.output.path)) {
        fs.mkdirSync(webpackConfig.output.path, { force: true });
    }

    webpackConfig.output.filename = `_${webpackConfig.output.filename}`;

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
