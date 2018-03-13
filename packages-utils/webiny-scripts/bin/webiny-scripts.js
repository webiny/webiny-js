#!/usr/bin/env node
const path = require("path");
const fs = require("fs");
const yargs = require("yargs");

if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "production";
}

const { argv } = yargs;
if (argv.require) {
    Array.isArray(argv.require) ? argv.require.map(r => require(r)) : require(argv.require);
}

// Configure browser sync with webpack config and dev/hot middleware
yargs.command(
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
        const { developApp } = require("./../");
        developApp(projectRoot, appRoot);
    }
);

// Build app
yargs.command(
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
        const { buildApp } = require("./../");
        buildApp(projectRoot, appRoot);
    }
);

// Build serve
yargs.command(
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
yargs.command(
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
yargs.argv;
