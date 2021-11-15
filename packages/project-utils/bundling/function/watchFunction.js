module.exports = options => {
    const webpack = require("webpack");

    const { overrides } = options;

    // Load base webpack config
    let webpackConfig = require("./createWatchConfig")(options);

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
