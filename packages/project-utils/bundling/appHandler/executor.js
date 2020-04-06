module.exports = options => {
    // Create webpack config
    const createWebpackConfig = require("./webpack.config");
    let webpackConfig = createWebpackConfig(options);

    // Customize webpack config
    if (typeof options.webpack === "function") {
        webpackConfig = options.webpack(webpackConfig);
    }

    // Run build
    return new Promise((resolve, reject) => {
        const webpack = require("webpack");
        return webpack(webpackConfig).run(async (err, stats) => {
            if (err) {
                return reject(err);
            }

            if (stats.hasErrors()) {
                const info = stats.toJson();

                if (stats.hasErrors()) {
                    console.error(info.errors);
                }

                return reject("Build failed!");
            }

            resolve();
        });
    });
};
