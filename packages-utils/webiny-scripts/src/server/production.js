const path = require("path");
const _ = require("lodash");
const browserSync = require("browser-sync").create();

module.exports = ({ routes, port, domain }) => {
    return ({ projectRoot }) => {
        const baseDir = path.join(projectRoot, "dist", process.env.NODE_ENV);
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

                        _.each(routes, (file, url) => {
                            if (req.url.startsWith(url)) {
                                req.url = "/" + _.trim(file, "/");
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

        browserSync.init(browserSyncConfig);
    };
};
