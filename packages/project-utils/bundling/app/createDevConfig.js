const path = require("path");
const chalk = require("chalk");
const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");
const { choosePort, prepareUrls } = require("react-dev-utils/WebpackDevServerUtils");
const openBrowserTab = require("react-dev-utils/openBrowser");
const clearConsole = require("react-dev-utils/clearConsole");
const { checkBrowsers } = require("react-dev-utils/browsersHelper");
const configFactory = require("./config/webpack.config");
const createDevServerConfig = require("./config/webpackDevServer.config");

module.exports = async (options = {}) => {
    const appIndexJs = options.entry || path.resolve("src", "index.tsx");

    if (typeof options.openBrowser === "undefined") {
        options.openBrowser = true;
    }

    // Makes the script crash on unhandled rejections instead of silently
    // ignoring them. In the future, promise rejections that are not handled will
    // terminate the Node.js process with a non-zero exit code.
    process.on("unhandledRejection", err => {
        throw err;
    });

    const paths = require("./config/paths")({ appIndexJs });
    const appName = require(paths.appPackageJson).name;

    const isInteractive = process.stdout.isTTY;

    const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
    const HOST = "0.0.0.0";

    let config = configFactory("development", { paths, babelCustomizer: options.babel });

    if (typeof options.webpack === "function") {
        config = options.webpack(config);
    }

    try {
        await checkBrowsers(paths.appPath, isInteractive);
        const port = await choosePort(HOST, DEFAULT_PORT);
        if (port == null) {
            // We have not found a port.
            return;
        }

        const protocol = process.env.HTTPS === "true" ? "https" : "http";
        const urls = prepareUrls(protocol, HOST, port);

        const devSocket = {
            warnings: warnings => devServer.sockWrite(devServer.sockets, "warnings", warnings),
            errors: errors => devServer.sockWrite(devServer.sockets, "errors", errors)
        };

        const compiler = webpack(config);
        require("./utils/webpackDevServer").applyCompilerHooks(compiler, { appName, urls, devSocket });

        const serverConfig = createDevServerConfig(urls.lanUrlForConfig, paths);
        const devServer = new WebpackDevServer(compiler, serverConfig);
        // Launch WebpackDevServer.
        devServer.listen(port, HOST, err => {
            if (err) {
                return console.log(err);
            }

            if (isInteractive) {
                clearConsole();
            }

            console.log(chalk.cyan("Starting the development server...\n"));
            if (options.openBrowser) {
                openBrowserTab(urls.localUrlForBrowser);
            }
        });

        ["SIGINT", "SIGTERM"].forEach(function(sig) {
            process.on(sig, function() {
                devServer.close();
                process.exit();
            });
        });
    } catch (err) {
        if (err && err.message) {
            console.log(err.message);
        }
        process.exit(1);
    }
};
