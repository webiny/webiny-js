import path from "path";
import webpack from "webpack";
import _ from "lodash";
import browserSync from "browser-sync";
import webpackDevMiddleware from "webpack-dev-middleware";
import webpackHotMiddleware from "webpack-hot-middleware";
import WriteFilePlugin from "write-file-webpack-plugin";

export default ({ routes, port, domain, devMiddleware }) => {
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
        config.plugins.push(new WriteFilePlugin(wfp));
        config.output.publicPath = `${domain}:${port}/`;

        // Create webpack compiler
        const compiler = webpack(config);

        const devMiddlewareOptions = {
            noInfo: false,
            stats: statsConfig,
            ...devMiddleware
        };

        // Run browser-sync server
        const baseDir = path.join(projectRoot, "dist", process.env.NODE_ENV);
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
                    webpackDevMiddleware(compiler, devMiddlewareOptions),
                    webpackHotMiddleware(compiler),
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
            },
            watchOptions: {
                ignoreInitial: true,
                ignored: "*.{html,js,json}"
            },
            // Files being watched for changes (add CSS of apps selected for build)
            files: [config.output.path + "/*.css"]
        };

        browserSync.create().init(browserSyncConfig);
    };
};
