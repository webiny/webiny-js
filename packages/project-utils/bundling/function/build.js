const formatWebpackMessages = require("react-dev-utils/formatWebpackMessages");

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
    let webpackConfig = require("./webpack.build.config")({
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
