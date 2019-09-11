const path = require("path");

module.exports = {
    entry: path.resolve("handler", "handler.js"),
    mode: "development",
    devtool: false,
    output: {
        filename: "handler.js",
        path: path.resolve("build"),
        libraryTarget: "commonjs"
    },
    externals: ["./ssr"],
    target: "node",
    node: {
        __dirname: false
    }
};
