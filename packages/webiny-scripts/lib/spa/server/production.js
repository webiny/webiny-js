"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _browserSync = require("browser-sync");

var _browserSync2 = _interopRequireDefault(_browserSync);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

exports.default = ({ routes, port, domain }) => {
    return ({ projectRoot }) => {
        const baseDir = _path2.default.join(projectRoot, "dist", process.env.NODE_ENV);
        // Run browser-sync server
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
            }
        };

        _browserSync2.default.create().init(browserSyncConfig);
    };
};
//# sourceMappingURL=production.js.map
