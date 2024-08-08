const formatWebpackMessages = require("react-dev-utils/formatWebpackMessages");
const { BaseFunctionBundler } = require("./BaseFunctionBundler");

class WebpackBundler extends BaseFunctionBundler {
    constructor({ cwd, overrides }) {
        super();
        this.cwd = cwd;
        this.overrides = overrides;
    }

    build() {
        return new Promise(async (resolve, reject) => {
            const bundlerConfig = require("./webpack/webpack.config.js")({
                cwd: this.cwd,
                overrides: this.overrides,
                production: true
            });

            require("webpack")(bundlerConfig, async (err, stats) => {
                let messages = {};

                if (err) {
                    messages = formatWebpackMessages({
                        errors: [err.message],
                        warnings: []
                    });

                    const errorMessages = messages.errors.join("\n\n");
                    console.error(errorMessages);
                    return reject(new Error(errorMessages));
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

                    const errorMessages = messages.errors.join("\n\n");
                    console.error(errorMessages);
                    reject(new Error(errorMessages));
                    return;
                }

                console.log(`Compiled successfully.`);
                resolve();
            });
        });
    }

    watch() {
        return new Promise(async (resolve, reject) => {
            console.log("Compiling...");

            const bundlerConfig = require("./webpack/webpack.config.js")({
                cwd: this.cwd,
                overrides: this.overrides,
                production: false
            });

            return require("webpack")(bundlerConfig).watch({}, async (err, stats) => {
                if (err) {
                    return reject(err);
                }

                if (!stats.hasErrors()) {
                    console.log("Compiled successfully.");
                } else {
                    console.log(stats.toString("errors-warnings"));
                }
            });
        });
    }
}

module.exports = { WebpackBundler };
