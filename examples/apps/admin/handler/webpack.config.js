const path = require("path");
const WebpackBar = require("webpackbar");

module.exports = {
    entry: path.resolve("handler", "handler.js"),
    mode: "development",
    devtool: false,
    plugins: [new WebpackBar({ name: "Admin handler" })],
    output: {
        filename: "handler.js",
        path: path.resolve("build"),
        libraryTarget: "commonjs"
    },
    target: "node",
    node: {
        __dirname: false
    }
};
