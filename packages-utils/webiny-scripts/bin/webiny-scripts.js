#!/usr/bin/env node
const path = require("path");
const fs = require("fs");
const program = require("yargs");

if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "production";
}

// Configure browser sync with webpack config and dev/hot middleware
program.command(
    "develop-app <appRoot>",
    "Start development server",
    cmd => {
        cmd.positional("appRoot", {
            describe: "App root folder relative to project root",
            type: "string"
        });
    },
    argv => {
        process.env.NODE_ENV = "development";

        const projectRoot = process.cwd();
        const appRoot = path.join(projectRoot, argv.appRoot);

        const UrlGenerator = require("./../lib/spa/urlGenerator");
        const urlGenerator = new UrlGenerator();

        const browserSync = require(path.join(appRoot, "server.js"));
        const baseWebpack = require("./../lib/spa/webpack.config")({
            projectRoot,
            appRoot,
            urlGenerator
        });
        const appWebpack = require(path.join(appRoot, "webpack.config.js"))({
            urlGenerator,
            config: baseWebpack
        });

        browserSync({ config: appWebpack, projectRoot, appRoot });
    }
);

// Build app
program.command(
    "build-app <appRoot>",
    "Build app",
    cmd => {
        cmd.positional("appRoot", {
            describe: "App root folder relative to project root",
            type: "string"
        });
    },
    argv => {
        const projectRoot = process.cwd();
        const appRoot = path.join(projectRoot, argv.appRoot);

        const UrlGenerator = require("./../lib/spa/urlGenerator");
        const urlGenerator = new UrlGenerator();

        const baseWebpack = require("./../lib/spa/webpack.config")({
            projectRoot,
            appRoot,
            urlGenerator
        });
        const appWebpack = require(path.join(appRoot, "webpack.config.js"))({
            config: baseWebpack,
            urlGenerator
        });

        const webpack = require("webpack");
        webpack(appWebpack).run(function(err, stats) {
            if (err) console.error(err);

            console.log(stats.toString({ colors: true }));
        });
    }
);

// Build serve
program.command(
    "serve <appRoot>",
    "Start simple server to serve content from the given folder",
    cmd => {
        cmd.positional("appRoot", {
            describe: "App folder relative to project root",
            type: "string"
        });
    },
    argv => {
        const projectRoot = process.cwd();
        const appRoot = path.join(projectRoot, argv.appRoot);

        const browserSync = require(path.join(appRoot, "server.js"));
        browserSync({ projectRoot, appRoot });
    }
);

// Build theme
program.command(
    "develop-plugin <themeRoot>",
    "Develop theme",
    cmd => {
        cmd.positional("themeRoot", {
            describe: "Theme root folder relative to project root",
            type: "string"
        });
    },
    argv => {
        const projectRoot = process.cwd();
        const themeRoot = path.join(projectRoot, argv.themeRoot);

        const env = process.env.NODE_ENV;
        let webpackConfig = require("./../lib/theme/webpack.config")({
            projectRoot,
            themeRoot,
            env
        });
        const themeConfig = path.join(themeRoot, "webpack.config.js");
        if (fs.existsSync(themeConfig)) {
            webpackConfig = require(themeConfig)({ config: webpackConfig, themeRoot, env });
        }
        const webpack = require("webpack");
        webpack(webpackConfig).watch({}, function(err, stats) {
            console.log(stats.toString({ colors: true }));
        });
    }
);

// Run script
program.argv;
