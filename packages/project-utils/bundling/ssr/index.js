const path = require("path");
const fs = require("fs-extra");

module.exports.buildAppSSR = async ({ app }, context) => {
    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = "production";
    }

    if (!process.env.REACT_APP_ENV) {
        process.env.REACT_APP_ENV = "ssr";
    }

    const indexHtml = path.resolve(app, "build", "index.html").replace(/\\/g, "\\\\");
    const appComponent = path.resolve(app, "src", "App").replace(/\\/g, "\\\\");

    const chalk = require("chalk");

    if (!fs.existsSync(indexHtml)) {
        console.log(
            `\n🚨 ${chalk.red(
                indexHtml
            )} does not exist!\nHave you built the app before running the SSR build?\n`
        );
        process.exit(1);
    }

    // Build SSR
    const buildDir = path.resolve("build");
    await fs.emptyDir(buildDir);

    // Generate SSR boilerplate code
    const entry = path.resolve("build", "source.js");
    const handler = path.resolve("build", "handler.js");
    let code = await fs.readFile(__dirname + "/template/ssr.js", "utf8");
    const importApp = `import { App } from "${appComponent}";`;
    code = code.replace("/*{import-app-component}*/", importApp);
    code = code.replace("/*{index-html-path}*/", indexHtml);
    await fs.writeFile(entry, code);
    await fs.copyFile(__dirname + "/template/handler.js", handler);

    // Create webpack config
    const createWebpackConfig = require("./webpack.config");
    const babelOptions = require("./babelrc");

    const config = createWebpackConfig({
        entry,
        outputPath: path.resolve("build"),
        outputFilename: "ssr.js",
        babelOptions
    });

    // Run build
    return new Promise((resolve, reject) => {
        const webpack = require("webpack");
        const formatWebpackMessages = require("react-dev-utils/formatWebpackMessages");

        webpack(config).run(async (err, stats) => {
            let messages;
            if (err) {
                if (!err.message) {
                    return reject(err);
                }

                let errMessage = err.message;

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

            await fs.unlink(entry);
            return resolve();
        });
    });
};
