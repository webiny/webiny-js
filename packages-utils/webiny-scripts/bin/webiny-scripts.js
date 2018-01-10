#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const program = require('yargs');

// Configure browser sync with webpack config and dev/hot middleware
program.command('develop-app <appRoot>', 'Start development server', (cmd) => {
    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'development';
    }

    cmd.positional('appRoot', {
        describe: 'App root folder relative to project root',
        type: 'string'
    })
}, (argv) => {
    const projectRoot = process.cwd();
    const appRoot = path.join(projectRoot, argv.appRoot);

    const env = process.env.NODE_ENV;
    const browserSync = require(path.join(appRoot, 'dev.server.js'));
    const baseWebpack = require('./../lib/spa/webpack.config')({ projectRoot, appRoot, env });
    const appWebpack = require(path.join(appRoot, 'webpack.config.js'))({ config: baseWebpack, env });

    browserSync({ config: appWebpack, projectRoot, appRoot });
});

// Build theme
program.command('develop-theme <themeRoot>', 'Develop theme', (cmd) => {
    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'development';
    }

    cmd.positional('themeRoot', {
        describe: 'Theme root folder relative to project root',
        type: 'string'
    })
}, (argv) => {
    const projectRoot = process.cwd();
    const themeRoot = path.join(projectRoot, argv.themeRoot);

    const env = process.env.NODE_ENV;
    let webpackConfig = require('./../lib/theme/webpack.config')({ projectRoot, themeRoot, env });
    const themeConfig = path.join(themeRoot, 'webpack.config.js');
    if (fs.existsSync(themeConfig)) {
        webpackConfig = require(themeConfig)({ config: webpackConfig, themeRoot, env });
    }
    const webpack = require('webpack');
    webpack(webpackConfig).watch({}, function (err, stats) {
        console.log(stats.toString({ colors: true }));
    });
});

program.command('build-app', 'Run production build', (argv) => {

});

// Run script
program.argv;