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
