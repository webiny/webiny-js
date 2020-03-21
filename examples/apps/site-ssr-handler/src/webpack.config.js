const path = require("path");
const WebpackBar = require("webpackbar");
const aliases = require("@webiny/project-utils/aliases/webpack");

module.exports = {
    entry: path.resolve(__dirname, "./handler.js"),
    mode: "development",
    devtool: false,
    plugins: [new WebpackBar({ name: "Site handler" })],
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
        alias: aliases,
        modules: [path.resolve("node_modules"), "node_modules"]
    }
};
