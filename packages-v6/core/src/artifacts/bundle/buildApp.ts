import fs from "fs-extra";
import webpack from "webpack";
// @ts-ignore
import chalk from "react-dev-utils/chalk";
// @ts-ignore
import checkRequiredFiles from "react-dev-utils/checkRequiredFiles";
// @ts-ignore
import formatWebpackMessages from "react-dev-utils/formatWebpackMessages";
// @ts-ignore
import FileSizeReporter from "react-dev-utils/FileSizeReporter";
// @ts-ignore
import printBuildError from "react-dev-utils/printBuildError";
// @ts-ignore
import { checkBrowsers } from "react-dev-utils/browsersHelper";
import { applyDefaults } from "./utils";
import getPaths, { Paths } from "./config/paths";
import { useWebiny } from "../../webiny";
import { Logger } from "../../utils/logger";
import { BabelConfigModifier, WebpackConfigModifier } from "./config/webpack.config";

export interface BuildOptions {
    cwd: string;
    entry: string;
    html: string;
    output: string;
    babelConfigModifier: BabelConfigModifier;
    webpackConfigModifier: WebpackConfigModifier;
}

export const buildApp = async (options: BuildOptions) => {
    applyDefaults();
    const { logger } = useWebiny();

    process.env.NODE_ENV = "production";
    const paths = getPaths({ appIndexJs: options.entry, cwd: options.cwd });

    // Makes the script crash on unhandled rejections instead of silently
    // ignoring them. In the future, promise rejections that are not handled will
    // terminate the Node.js process with a non-zero exit code.
    process.on("unhandledRejection", err => {
        throw err;
    });

    // Ensure environment variables are read.
    const { createWebpackConfig } = await import("./config/webpack.config");

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
    paths.appBuild = options.output;
    let config = createWebpackConfig(process.env.NODE_ENV, {
        paths,
        babelConfigModifier: options.babelConfigModifier
    });

    // Apply webpack modifiers
    if (options.webpackConfigModifier) {
        config = options.webpackConfigModifier(config);
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
            logger
        });
        if (warnings.length) {
            logger.warning("Compiled with warnings.\n");
            logger.log(warnings.join("\n\n"));
            logger.log(
                "\nSearch for the " +
                    chalk.underline(chalk.yellow("keywords")) +
                    " to learn more about each warning."
            );
            logger.log(
                "To ignore, add " +
                    chalk.cyan("// eslint-disable-next-line") +
                    " to the line before.\n"
            );
        } else {
            logger.success("Compiled successfully.\n");
        }

        logger.log("File sizes after gzip:\n");
        printFileSizesAfterBuild(
            stats,
            previousFileSizes,
            paths.appBuild,
            WARN_AFTER_BUNDLE_GZIP_SIZE,
            WARN_AFTER_CHUNK_GZIP_SIZE
        );
        logger.log("\n");
    } catch (err) {
        const tscCompileOnError = process.env.TSC_COMPILE_ON_ERROR === "true";
        if (tscCompileOnError) {
            logger.warning(
                "Compiled with the following type errors (you may want to check these before deploying your app):\n"
            );
            printBuildError(err);
        } else {
            logger.error(err);
            logger.error("Failed to compile.\n");
            printBuildError(err);
            process.exit(1);
        }
    }
};

// Create the production build and print the deployment instructions.
interface BuildParams {
    config: webpack.Configuration;
    previousFileSizes: FileSizeReporter.OpaqueFileSizes;
    logger: Logger;
}

interface BuildOutput {
    stats: webpack.Stats;
    previousFileSizes: FileSizeReporter.OpaqueFileSizes;
    warnings: string[];
}

function build({ config, previousFileSizes, logger }: BuildParams): Promise<BuildOutput> {
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
                if (err.hasOwnProperty("postcssNode")) {
                    // @ts-ignore
                    const selector = err["postcssNode"].selector;
                    errMessage += "\nCompileError: Begins at CSS selector " + selector;
                }

                messages = formatWebpackMessages({
                    errors: [errMessage],
                    warnings: []
                });
            } else {
                messages = formatWebpackMessages(
                    stats!.toJson({
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
                logger.warning(
                    "\nTreating warnings as errors because process.env.CI = true.\n" +
                        "Most CI servers set it automatically.\n"
                );
                return reject(new Error(messages.warnings.join("\n\n")));
            }

            return resolve({
                stats: stats!,
                previousFileSizes,
                warnings: messages.warnings
            });
        });
    });
}

function copyPublicFolder(paths: Paths) {
    fs.copySync(paths.appPublic, paths.appBuild, {
        dereference: true,
        filter: file => file !== paths.appHtml
    });
}
