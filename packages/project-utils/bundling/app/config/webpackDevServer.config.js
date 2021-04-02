"use strict";

const errorOverlayMiddleware = require("react-dev-utils/errorOverlayMiddleware");
const evalSourceMapMiddleware = require("react-dev-utils/evalSourceMapMiddleware");
const ignoredFiles = require("react-dev-utils/ignoredFiles");

const protocol = process.env.HTTPS === "true" ? "https" : "http";
const host = process.env.HOST || "0.0.0.0";

module.exports = function(allowedHost, paths) {
    return {
        // Enable gzip compression of generated files.
        compress: true,
        // Silence WebpackDevServer's own logs since they're generally not useful.
        // It will still show compile warnings and errors with this setting.
        clientLogLevel: "none",
        contentBase: paths.appPublic,
        // By default files from `contentBase` will not trigger a page reload.
        watchContentBase: true,
        hot: true,
        transportMode: "ws",
        // Prevent a WS client from getting injected as we're already including
        // `webpackHotDevClient`.
        injectClient: false,
        // It is important to tell WebpackDevServer to use the same "root" path
        // as we specified in the config. In development, we always serve from /.
        publicPath: "/",
        // WebpackDevServer is noisy by default so we emit custom message instead
        // by listening to the compiler events with `compiler.hooks[...].tap` calls above.
        //quiet: true,
        // Reportedly, this avoids CPU overload on some systems.
        // https://github.com/facebook/create-react-app/issues/293
        // src/node_modules is not ignored to support absolute imports
        // https://github.com/facebook/create-react-app/issues/1065
        watchOptions: {
            ignored: ignoredFiles(paths.appSrc)
        },
        // Enable HTTPS if the HTTPS environment variable is set to 'true'
        https: protocol === "https",
        host,
        overlay: false,
        historyApiFallback: {
            // Paths with dots should still use the history fallback.
            // See https://github.com/facebook/create-react-app/issues/387.
            disableDotRule: true
        },
        public: allowedHost,
        before(app, server) {
            // This lets us fetch source contents from webpack for the error overlay
            app.use(evalSourceMapMiddleware(server));
            // This lets us open files from the runtime error overlay.
            app.use(errorOverlayMiddleware());
        }
    };
};
