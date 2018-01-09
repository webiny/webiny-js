// We need this to override some webpack classes (did not have time to tinker with pull requests, etc.)
const path = require('path');
const webpack = require('webpack');
const _ = require('lodash');
const fs = require('fs-extra');
const browserSync = require('browser-sync').create();
const devMiddleware = require('webpack-dev-middleware');
const hotMiddleware = require('webpack-hot-middleware');
const WriteFilePlugin = require('write-file-webpack-plugin');
const Webiny = require('webiny-cli/lib/webiny');
const Build = require('./../Build/task');

class Develop extends Build {

    constructor(config) {
        super(config);
        this.domain = _.get(Webiny.getConfig(), 'cli.domain', 'http://localhost');
        this.port = _.get(Webiny.getConfig(), 'cli.port', 3000);
        this.webpackCallback = config.webpackCallback || null;
        this.progressCallback = config.progressCallback || null;
    }

    run() {
        const msg = 'Please be patient, the initial webpack build may take a few moments...';
        const line = new Array(msg.length + 3).join('-');
        Webiny.log("\n" + line);
        Webiny.info(msg);
        Webiny.log(line);

        const statsConfig = {
            all: false,
            errors: true,
            errorDetails: true,
            entrypoints: true,
            colors: true
        };

        const config = this.getAppConfig();
        return Webiny.dispatch('before-webpack', {app: config}).then(() => {
            return this.buildAndWatch(config, statsConfig);
        });
    }

    buildAndWatch(config, statsConfig) {
        // Write webpack files to disk to trigger BrowserSync injection on CSS
        const wfp = {log: false, test: /^((?!hot-update).)*$/};
        config.devServer = {outputPath: config.output.path};
        config.plugins.push(new WriteFilePlugin(wfp));

        // Create webpack compiler
        // If we are only building one app we MUST NOT pass an array!!
        // An array causes webpack to treat it as MultiCompiler and it resolves hot update file paths incorrectly thus breaking hot reload
        const compiler = webpack(config);

        const devMiddlewareOptions = {
            publicPath: '/',
            noInfo: false,
            stats: statsConfig
        };

        return Webiny.dispatch('dev-middleware-options', {devMiddlewareOptions, config: this.config}).then(() => {
            // Run browser-sync server
            const baseDir = path.join(Webiny.projectRoot('dist'), 'development');
            const browserSyncConfig = {
                ui: false,
                open: false,
                logPrefix: 'Webiny',
                online: false,
                port: this.port,
                socket: {
                    domain: `${this.domain}:${this.port}`
                },
                server: {
                    baseDir,
                    middleware: [
                        devMiddleware(compiler, devMiddlewareOptions),
                        hotMiddleware(compiler),
                        (req, res, next) => {
                            if (/\.[a-z]{2,}/.test(req.url)) {
                                return next();
                            }

                            _.each(this.config.routes, (file, url) => {
                                if (req.url.startsWith(url)) {
                                    req.url = '/' + _.trim(file, '/');
                                    return false;
                                }
                            });
                            return next();
                        },
                        (req, res, next) => {
                            res.setHeader('Access-Control-Allow-Origin', '*');
                            next();
                        }
                    ]
                },
                watchOptions: {
                    ignoreInitial: true,
                    ignored: '*.{html,js,json}'
                },
                // Files being watched for changes (add CSS of apps selected for build)
                files: [
                    config.output.path + '/*.css'
                ]
            };

            return Webiny.dispatch('browser-sync-config', {browserSyncConfig, config: this.config}).then(() => {
                // Return a promise which never resolves. It will keep the task running until you abort the process.
                return new Promise(() => {
                    Webiny.info('Building your app...');
                    browserSync.init(browserSyncConfig);
                });
            });
        });
    }
}

module.exports = Develop;