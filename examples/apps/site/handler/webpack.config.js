const path = require("path");
const webpack = require("webpack");
const WebpackBar = require("webpackbar");

module.exports = {
    entry: path.resolve("handler", "handler.js"),
    mode: "development",
    devtool: false,
    plugins: [
        new WebpackBar({ name: "Site handler" }),
        new webpack.DefinePlugin({
            "process.env.REACT_APP_API_URL": JSON.stringify(process.env.REACT_APP_API_URL)
        })
    ],
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
