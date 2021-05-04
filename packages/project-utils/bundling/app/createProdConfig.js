"use strict";
const path = require("path");
const chalk = require("chalk");
const fs = require("fs-extra");
const webpack = require("webpack");
const { checkBrowsers } = require("react-dev-utils/browsersHelper");

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
        await build(config);
    } catch (err) {
        console.log(err.message);
        console.log(chalk.red("Failed to compile.\n"));
        process.exit(1);
    }
};

// Create the production build and print the deployment instructions.
function build(config) {
    console.log("Creating an optimized production build...");

    const compiler = webpack(config);
    return new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
            if (err) {
                return reject(err);
            }
            
            console.log(
                stats.toString({
                    all: false,
                    colors: true,
                    assets: true,
                    modules: false,
                    entrypoints: true,
                    warnings: true,
                    errors: true
                })
            );
            return resolve();
        });
    });
}

function copyPublicFolder(paths) {
    fs.copySync(paths.appPublic, paths.appBuild, {
        dereference: true,
        filter: file => file !== paths.appHtml
    });
}
