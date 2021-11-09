const formatWebpackMessages = require("react-dev-utils/formatWebpackMessages");

module.exports = params => {
    const { boolean } = require("boolean");
    const webpack = require("webpack");
    let babelOptions = require("./babelrc");

    const { getOutput, getEntry } = require("./utils");
    const output = getOutput(params);
    const entry = getEntry(params);

    const { options, config, context } = params;
    const overrides = config.overrides || {};

    // Customize Babel options.
    if (typeof overrides.babel === "function") {
        babelOptions = overrides.babel(babelOptions);
    }

    // Load base Webpack config.
    let webpackConfig = require("./webpack.build.config")({
        entry,
        output,
        debug: boolean(options.debug),
        babelOptions,
        define: overrides.define
    });

    // Customize Webpack config.
    if (typeof overrides.webpack === "function") {
        webpackConfig = overrides.webpack(webpackConfig);
    }

    return new Promise(async (resolve, reject) => {
        return webpack(webpackConfig).run(async (err, stats) => {
            let messages = {};

            if (err) {
                messages = formatWebpackMessages({
                    errors: [err.message],
                    warnings: []
                });

                return reject(new Error(messages.errors.join("\n\n")));
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
                return reject(new Error(messages.errors.join("\n\n")));
            }

            context.log(`Finished bundling`);
            resolve();
        });
    });
};
