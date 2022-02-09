"use strict";
const path = require("path");
const fs = require("fs-extra");
const webpack = require("webpack");
const chalk = require("react-dev-utils/chalk");
const checkRequiredFiles = require("react-dev-utils/checkRequiredFiles");
const formatWebpackMessages = require("react-dev-utils/formatWebpackMessages");
const FileSizeReporter = require("react-dev-utils/FileSizeReporter");
const printBuildError = require("react-dev-utils/printBuildError");
const { checkBrowsers } = require("react-dev-utils/browsersHelper");
const { applyDefaults } = require("./utils");

module.exports = async options => {
    applyDefaults();

    process.env.NODE_ENV = "production";

    const { cwd, overrides } = options;

    const log = options.logs ? console.log : () => undefined;

    const appIndexJs = overrides.entry || path.resolve(cwd, "src", "index.tsx");

    const paths = require("./config/paths")({ appIndexJs, cwd });

    if (overrides.output) {
        paths.appBuild = path.resolve(overrides.output);
    }

    // Makes the script crash on unhandled rejections instead of silently
    // ignoring them. In the future, promise rejections that are not handled will
    // terminate the Node.js process with a non-zero exit code.
    process.on("unhandledRejection", err => {
        throw err;
    });

    // Ensure environment variables are read.
    const configFactory = require("./config/webpack.config");

    const measureFileSizesBeforeBuild = FileSizeReporter.measureFileSizesBeforeBuild;
    const printFileSizesAfterBuild = FileSizeReporter.printFileSizesAfterBuild;

    // These sizes are pretty large. We'll warn for bundles exceeding them.
    const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
    const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

    const isInteractive = process.stdout.isTTY;

    // Warn and crash if required files are missing
    if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
        process.exit(1);
    }

    // We require that you explicitly set browsers and do not fall back to browsers list defaults.
    await checkBrowsers(paths.appPath, isInteractive);

    // Generate configuration
    let config = configFactory("production", { paths, options });

    if (typeof overrides.webpack === "function") {
        config = overrides.webpack(config);
    }

    // First, read the current file sizes in build directory.
    // This lets us display how much they changed later.
    const existingFileSizes = await measureFileSizesBeforeBuild(paths.appBuild);

    // Remove all content but keep the directory so that
    // if you're in it, you don't end up in Trash
    fs.emptyDirSync(paths.appBuild);

    // Merge with the public folder
    copyPublicFolder(paths);

    // Start the webpack build
    try {
        const { stats, previousFileSizes, warnings } = await build({
            config,
            previousFileSizes: existingFileSizes,
            options,
            log
        });
        if (warnings.length) {
            log(chalk.yellow("Compiled with warnings.\n"));
            log(warnings.join("\n\n"));
            log(
                "\nSearch for the " +
                    chalk.underline(chalk.yellow("keywords")) +
                    " to learn more about each warning."
            );
            log(
                "To ignore, add " +
                    chalk.cyan("// eslint-disable-next-line") +
                    " to the line before.\n"
            );
        } else {
            log(chalk.green("Compiled successfully.\n"));
        }

        log("File sizes after gzip:\n");
        options.logs &&
            printFileSizesAfterBuild(
                stats,
                previousFileSizes,
                paths.appBuild,
                WARN_AFTER_BUNDLE_GZIP_SIZE,
                WARN_AFTER_CHUNK_GZIP_SIZE
            );
        log();
    } catch (err) {
        const tscCompileOnError = process.env.TSC_COMPILE_ON_ERROR === "true";
        if (tscCompileOnError) {
            log(
                chalk.yellow(
                    "Compiled with the following type errors (you may want to check these before deploying your app):\n"
                )
            );
            printBuildError(err);
        } else {
            log(err);
            log(chalk.red("Failed to compile.\n"));
            printBuildError(err);
            process.exit(1);
        }
    }
};

// Create the production build and print the deployment instructions.
function build({ config, previousFileSizes, log }) {
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
            if (Array.isArray(messages.errors) && messages.errors.length) {
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
                log(
                    chalk.yellow(
                        "\nTreating warnings as errors because process.env.CI = true.\n" +
                            "Most CI servers set it automatically.\n"
                    )
                );
                return reject(new Error(messages.warnings.join("\n\n")));
            }

            return resolve({
                stats,
                previousFileSizes,
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
