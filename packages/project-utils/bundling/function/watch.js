module.exports = (options, context) => {
    const { boolean } = require("boolean");
    const webpack = require("webpack");
    let babelOptions = require("./babelrc");
    const { setupOutput } = require("./utils");
    const output = setupOutput(options.output);

    // Customize babelOptions
    if (typeof options.babel === "function") {
        babelOptions = options.babel(babelOptions);
    }

    // Load base webpack config
    let webpackConfig = require("./webpack.watch.config")({
        entry: options.entry || "./src/index",
        output,
        debug: boolean(options.debug),
        babelOptions,
        define: options.define
    });

    // Customize webpack config
    if (typeof options.webpack === "function") {
        webpackConfig = options.webpack(webpackConfig);
    }

    return new Promise(async (resolve, reject) => {
        context.log(`Start bundling`);

        return webpack(webpackConfig).watch({}, async (err, stats) => {
            if (err) {
                return reject(err);
            }

            if (stats.hasErrors()) {
                const info = stats.toJson();

                if (stats.hasErrors()) {
                    console.error(info.errors);
                }
            }

            context.log(`Finished bundling! Watching for changes...`);
        });
    });
};
