async function injectHandlerTelemetry(cwd) {
    await telemetry.updateTelemetryFunction();

    fs.copyFileSync(path.join(cwd, "build", "handler.js"), path.join(cwd, "build", "_handler.js"));

    // Create a new handler.js.
    const telemetryFunction = fs.readFileSync(path.join(__dirname, "/telemetryFunction.js"), {
        encoding: "utf8",
        flag: "r"
    });

    fs.writeFileSync(path.join(cwd, "build", "handler.js"), telemetryFunction);
}

module.exports = options => {
    const webpack = require("webpack");

    const { overrides } = options;

    // Load base webpack config
    let webpackConfig = require("./webpack.config")({
        production: false,
        ...options
    });

    // Customize Webpack config.
    if (typeof overrides.webpack === "function") {
        webpackConfig = overrides.webpack(webpackConfig);
    }

    const result = new Promise(async (resolve, reject) => {
        options.logs && console.log("Compiling...");
        return webpack(webpackConfig).watch({}, async (err, stats) => {
            if (err) {
                return reject(err);
            }

            if (!stats.hasErrors()) {
                options.logs && console.log("Compiled successfully.");
            } else {
                options.logs && console.log(stats.toString("errors-warnings"));
            }
        });
    });

    const project = getProject({ cwd });

    if (!project.config.id) {
        return result;
    }

    const handlerFile = fs.readFileSync(path.join(options.cwd, "/build/handler.js"), {
        encoding: "utf8",
        flag: "r"
    });
    const includesGraphQl = handlerFile.includes("handler-graphql");

    if (includesGraphQl) {
        await injectHandlerTelemetry(cwd);
    }

    return result;
};
