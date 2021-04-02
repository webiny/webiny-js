"use strict";
const path = require("path");
const chalk = require("chalk");
const fs = require("fs-extra");
const webpack = require("webpack");
const { checkBrowsers } = require("react-dev-utils/browsersHelper");
const formatWebpackMessages = require("react-dev-utils/formatWebpackMessages");
const printBuildError = require("react-dev-utils/printBuildError");

module.exports = async (options = {}) => {
    const appIndexJs = options.entry || path.resolve("src", "index.tsx");
    const paths = require("./config/paths")({ appIndexJs });

    if (options.output) {
        paths.appBuild = path.resolve(options.output);
    }

    // Makes the script crash on unhandled rejections instead of silently
    // ignoring them. In the future, promise rejections that are not handled will
    // terminate the Node.js process with a non-zero exit code.
    process.on("unhandledRejection", err => {
        throw err;
    });

    // Ensure environment variables are read.
    const configFactory = require("./config/webpack.config");

    const isInteractive = process.stdout.isTTY;

    // We require that you explicitly set browsers and do not fall back to browsers list defaults.
    await checkBrowsers(paths.appPath, isInteractive);

    // Generate configuration
    let config = configFactory("production", { paths, babelCustomizer: options.babel });

    if (typeof options.webpack === "function") {
        config = options.webpack(config);
    }

    // Remove all content but keep the directory so that
    // if you're in it, you don't end up in Trash
    fs.emptyDirSync(paths.appBuild);

    // Merge with the public folder
    copyPublicFolder(paths);

    // Start the webpack build
    try {
        const { warnings } = await build(config);
        if (warnings.length) {
            console.log(chalk.yellow("Compiled with warnings.\n"));
            console.log(warnings.join("\n\n"));
            console.log(
                "\nSearch for the " +
                chalk.underline(chalk.yellow("keywords")) +
                " to learn more about each warning."
            );
            console.log(
                "To ignore, add " +
                chalk.cyan("// eslint-disable-next-line") +
                " to the line before.\n"
            );
        } else {
            console.log(chalk.green("Compiled successfully.\n"));
        }
    } catch (err) {
        console.log(err);
        console.log(chalk.red("Failed to compile.\n"));
        printBuildError(err);
        process.exit(1);
    }
};

// Create the production build and print the deployment instructions.
function build(config) {
    console.log("Creating an optimized production build...");

    const compiler = webpack(config);
    return new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
            let messages;
            if (err) {
                if (!err.message) {
                    return reject(err);
                }

                let errMessage = err.message;

                // Add additional information for postcss errors
                if (Object.prototype.hasOwnProperty.call(err, "postcssNode")) {
                    errMessage +=
                        "\nCompileError: Begins at CSS selector " + err["postcssNode"].selector;
                }

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

            return resolve({
                stats,
                warnings: messages.warnings
            });
        });
    });
}

function copyPublicFolder(paths) {
    fs.copySync(paths.appPublic, paths.appBuild, {
        dereference: true,
        filter: file => file !== paths.appHtml
    });
}
