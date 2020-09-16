module.exports.bundle = ({ entry, output, ...options }) => {
    // Create webpack config
    const createWebpackConfig = require("./webpack.config");
    let babelOptions = require("./babelrc");

    // Customize babelOptions
    if (typeof options.babel === "function") {
        babelOptions = options.babel(babelOptions);
    }

    let webpackConfig = createWebpackConfig({
        entry,
        output,
        babelOptions
    });

    // Customize webpack config
    if (typeof options.webpack === "function") {
        webpackConfig = options.webpack(webpackConfig);
    }

    // Run build
    return new Promise((resolve, reject) => {
        const webpack = require("webpack");
        const formatWebpackMessages = require("react-dev-utils/formatWebpackMessages");

        webpack(webpackConfig).run(async (err, stats) => {
            let messages;
            if (err) {
                if (!err.message) {
                    return reject(err);
                }

                const errMessage = err.message;

                messages = formatWebpackMessages({
                    errors: [errMessage],
                    warnings: []
                });
            } else {
                messages = formatWebpackMessages(
                    stats.toJson({
                        all: false,
                        warnings: true,
                        errors: true
                    })
                );
            }
            if (messages.errors.length) {
                // Only keep the first error. Others are often indicative
                // of the same problem, but confuse the reader with noise.
                if (messages.errors.length > 1) {
                    messages.errors.length = 1;
                }
                return reject(new Error(messages.errors.join("\n\n")));
            }
            if (
                process.env.CI &&
                (typeof process.env.CI !== "string" || process.env.CI.toLowerCase() !== "false") &&
                messages.warnings.length
            ) {
                console.log(
                    chalk.yellow(
                        "\nTreating warnings as errors because process.env.CI = true.\n" +
                            "Most CI servers set it automatically.\n"
                    )
                );
                return reject(new Error(messages.warnings.join("\n\n")));
            }

            return resolve();
        });
    });
};
