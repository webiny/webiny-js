const path = require("path");
const WebpackBar = require("webpackbar");

module.exports = {
    entry: path.resolve("handler", "handler.js"),
    mode: "development",
    devtool: false,
    plugins: [new WebpackBar({ name: "Site handler" })],
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
    }
};
