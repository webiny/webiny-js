module.exports = () => {
    const path = require("path");
    const WebpackBar = require("webpackbar");

    return {
        entry: path.resolve(__dirname, "./handler.js"),
        mode: "development",
        // Generate sourcemaps for proper error messages
        devtool: "source-map",
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
        }
    };
};
