"use strict";

const fs = require("fs");

module.exports = function ({ host, port, https, allowedHost, proxy, paths }) {
    return {
        host,
        port,
        // Enable gzip compression of generated files.
        compress: true,
        static: {
            // By default WebpackDevServer serves physical files from current directory
            // in addition to all the virtual build products that it serves from memory.
            // This is confusing because those files won’t automatically be available in
            // production build folder unless we copy them. However, copying the whole
            // project directory is dangerous because we may expose sensitive files.
            // Instead, we establish a convention that only files in `public` directory
            // get served. Our build script will copy `public` into the `build` folder.
            // In `index.html`, you can get URL of `public` folder with %PUBLIC_URL%:
            // <link rel="icon" href="%PUBLIC_URL%/favicon.ico">
            // In JavaScript code, you can access it with `process.env.PUBLIC_URL`.
            // Note that we only recommend to use `public` folder as an escape hatch
            // for files like `favicon.ico`, `manifest.json`, and libraries that are
            // for some reason broken when imported through Webpack. If you just want to
            // use an image, put it in `src` and `import` it from JavaScript instead.
            directory: paths.appPublic,
            // By default files from `contentBase` will not trigger a page reload.
            watch: true
        },
        // Enable hot reloading server. It will provide /sockjs-node/ endpoint
        // for the WebpackDevServer client so it can learn when the files were
        // updated. The WebpackDevServer client is included as an entry point
        // in the Webpack development configuration. Note that only changes
        // to CSS are currently hot reloaded. JS changes will refresh the browser.
        hot: true,
        // Use 'ws' instead of 'sockjs-node' on server since we're using native
        // websockets in `webpackHotDevClient`.
        webSocketServer: "ws",

        devMiddleware: {
            // It is important to tell WebpackDevServer to use the same "root" path
            // as we specified in the config. In development, we always serve from /.
            publicPath: "/"
        },
        // Enable HTTPS if the HTTPS environment variable is set to 'true'
        https,
        host,
        client: {
            overlay: true,
            // Silence WebpackDevServer's own logs since they're generally not useful.
            // It will still show compile warnings and errors with this setting.
            logging: "warn",
            progress: true
        },
        historyApiFallback: {
            // Paths with dots should still use the history fallback.
            // See https://github.com/facebook/create-react-app/issues/387.
            disableDotRule: true
        },
        allowedHosts: allowedHost ? [allowedHost] : undefined,
        proxy,
        onBeforeSetupMiddleware(devServer) {
            const { app } = devServer;
            if (fs.existsSync(paths.proxySetup)) {
                // This registers user provided middleware for proxy reasons
                require(paths.proxySetup)(app);
            }
        }
    };
};
