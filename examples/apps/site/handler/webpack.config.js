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
    externals: ["./renderer"],
    target: "node",
    node: {
        __filename: false,
        __dirname: false
    },
};
