const path = require('path');
const webpack = require('webpack');
const _ = require('lodash');
const browserSync = require('browser-sync').create();
const devMiddleware = require('webpack-dev-middleware');
const hotMiddleware = require('webpack-hot-middleware');
const WriteFilePlugin = require('write-file-webpack-plugin');

module.exports = ({ routes, port, domain }) => {
    return ({ config, projectRoot }) => {
        const statsConfig = {
            all: false,
            errors: true,
            errorDetails: true,
            entrypoints: true,
            colors: true
        };

        // Write webpack files to disk to trigger BrowserSync injection of CSS
        const wfp = { log: false, test: /^((?!hot-update).)*$/ };
        config.devServer = { outputPath: config.output.path };
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

        // Run browser-sync server
        const baseDir = path.join(projectRoot, 'dist', 'development');
        const browserSyncConfig = {
            ui: false,
            open: false,
            logPrefix: 'Webiny',
            online: false,
            port,
            socket: {
                domain: `${domain}:${port}`
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

                        _.each(routes, (file, url) => {
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

        browserSync.init(browserSyncConfig);
    };
};