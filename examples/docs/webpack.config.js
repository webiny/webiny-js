/* eslint-disable */
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { spa } = require("webiny-scripts");

const { appEntry, SpaConfigPlugin } = spa;

module.exports = ({ config }) => {
    // Build webpack config
    config.entry["app"] = appEntry(__dirname + "/src/index.js");
    config.entry["admin"] = appEntry(__dirname + "/src/admin/index.js");

    config.plugins = [
        ...config.plugins,
        new HtmlWebpackPlugin({
            name: "app",
            filename: "index.html",
            template: __dirname + "/src/index.html",
            chunks: ["app"]
        }),
        new HtmlWebpackPlugin({
            name: "admin",
            filename: "admin.html",
            template: __dirname + "/src/admin/index.html",
            chunks: ["admin"]
        }),
        new SpaConfigPlugin()
    ];

    return config;
};
