const formatWebpackMessages = require("react-dev-utils/formatWebpackMessages");
const { getDuration } = require("../../utils");
const chalk = require("chalk");
const fs = require("fs");
const telemetry = require("./telemetry");

async function injectHandlerTelemetry() {
    await telemetry.getLatestTelemetryFunction();

    fs.copyFileSync(
        path.join(cwd, "build", "handler.js"),
        path.join(cwd, "build", "_handler.js")
    );

    // Create a new handler.js.
    const telemetryFunction = fs.readFileSync(path.join(__dirname, "/telemetryFunction.js"), {
        encoding: "utf8",
        flag: "r"
    });

    fs.writeFileSync(path.join(cwd, "build", "handler.js"), telemetryFunction);
}

module.exports = async options => {
    const duration = getDuration();
    const path = require("path");

    const { overrides, logs, cwd } = options;

    logs && console.log(`Compiling ${chalk.green(path.basename(cwd))}...`);

    let webpackConfig = require("./createBuildConfig")(options);

    // Customize Webpack config.
    if (typeof overrides.webpack === "function") {
        webpackConfig = overrides.webpack(webpackConfig);
    }

    const webpack = require("webpack");
    const result = await new Promise(async (resolve, reject) => {
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

            logs && console.log(`Compiled successfully in ${chalk.green(duration()) + "s"}.`);
            resolve();
        });
    });

    const handlerFile = fs.readFileSync(path.join(options.cwd, "/build/handler.js"), {
        encoding: "utf8",
        flag: "r"
    });
    const includesGraphQl = handlerFile.includes("handler-graphql");

    if (includesGraphQl) {
        await injectHandlerTelemetry();
    }

    return result;
};
