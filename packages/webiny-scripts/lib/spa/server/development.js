"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _assign = require("babel-runtime/core-js/object/assign");

var _assign2 = _interopRequireDefault(_assign);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _webpack = require("webpack");

var _webpack2 = _interopRequireDefault(_webpack);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _browserSync = require("browser-sync");

var _browserSync2 = _interopRequireDefault(_browserSync);

var _webpackDevMiddleware = require("webpack-dev-middleware");

var _webpackDevMiddleware2 = _interopRequireDefault(_webpackDevMiddleware);

var _webpackHotMiddleware = require("webpack-hot-middleware");

var _webpackHotMiddleware2 = _interopRequireDefault(_webpackHotMiddleware);

var _writeFileWebpackPlugin = require("write-file-webpack-plugin");

var _writeFileWebpackPlugin2 = _interopRequireDefault(_writeFileWebpackPlugin);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = ({ routes, port, domain, devMiddleware }) => {
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
        config.plugins.push(new _writeFileWebpackPlugin2.default(wfp));
        config.output.publicPath = `${domain}:${port}/`;

        // Create webpack compiler
        const compiler = (0, _webpack2.default)(config);

        const devMiddlewareOptions = (0, _assign2.default)(
            {
                noInfo: false,
                stats: statsConfig
            },
            devMiddleware
        );

        // Run browser-sync server
        const baseDir = _path2.default.join(projectRoot, "dist", process.env.NODE_ENV);
        const browserSyncConfig = {
            ui: false,
            open: false,
            logPrefix: "Webiny",
            online: false,
            port,
            socket: {
                domain: `${domain}:${port}`
            },
            server: {
                baseDir,
                middleware: [
                    (0, _webpackDevMiddleware2.default)(compiler, devMiddlewareOptions),
                    (0, _webpackHotMiddleware2.default)(compiler),
                    (req, res, next) => {
                        if (/\.[a-z]{2,}/.test(req.url)) {
                            return next();
                        }

                        _lodash2.default.each(routes, (file, url) => {
                            if (req.url.startsWith(url)) {
                                req.url = "/" + _lodash2.default.trim(file, "/");
                                return false;
                            }
                        });
                        return next();
                    },
                    (req, res, next) => {
                        res.setHeader("Access-Control-Allow-Origin", "*");
                        next();
                    }
                ]
            },
            watchOptions: {
                ignoreInitial: true,
                ignored: "*.{html,js,json}"
            },
            // Files being watched for changes (add CSS of apps selected for build)
            files: [config.output.path + "/*.css"]
        };

        _browserSync2.default.create().init(browserSyncConfig);
    };
};
//# sourceMappingURL=development.js.map
