/* eslint-disable */
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { spa } = require("webiny-scripts");

const { appEntry, SpaConfigPlugin } = spa;

module.exports = ({ config }) => {
    // Build webpack config
    config.entry["frontend"] = appEntry(__dirname + "/src/Frontend/index.js");
    config.entry["admin"] = appEntry(__dirname + "/src/Admin/index.js");

    config.plugins = [
        ...config.plugins,
        new HtmlWebpackPlugin({
            name: "frontend",
            filename: "frontend.html",
            template: __dirname + "/src/Frontend/index.html",
            chunks: ["frontend"]
        }),
        new HtmlWebpackPlugin({
            name: "admin",
            filename: "admin.html",
            template: __dirname + "/src/Admin/index.html",
            chunks: ["admin"]
        }),
        new SpaConfigPlugin()
    ];

    return config;
};
