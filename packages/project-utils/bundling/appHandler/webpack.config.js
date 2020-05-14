module.exports = ({ ssr }) => {
    const path = require("path");
    const WebpackBar = require("webpackbar");

    if (typeof process.env["GENERATE_SOURCEMAP"] === "undefined") {
        process.env.GENERATE_SOURCEMAP = "false";
    }

    // Source maps are resource heavy and can cause out of memory issue for large source files.
    const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== "false";
    let sourceMapRegister = null;
    if (!shouldUseSourceMap) {
        sourceMapRegister = {
            test: /source-map-support/,
            use: require.resolve("null-loader", { paths: [__dirname] })
        };
    }

    return {
        entry: path.resolve(__dirname, ssr ? "./handlerWithSSR.js" : "./handler.js"),
        mode: "development",
        // Generate sourcemaps for proper error messages
        devtool: shouldUseSourceMap ? "source-map" : false,
        plugins: [new WebpackBar({ name: "App handler" })],
        output: {
            filename: "handler.js",
            path: path.resolve("build"),
            libraryTarget: "commonjs"
        },
        target: "node",
        node: {
            __dirname: false
        },
        resolve: {
            modules: [path.resolve("node_modules"), "node_modules"]
        },
        module: {
            rules: [sourceMapRegister].filter(Boolean)
        }
    };
};
