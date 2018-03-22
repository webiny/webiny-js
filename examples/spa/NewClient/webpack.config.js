/* eslint-disable */
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { spa } = require("webiny-scripts");

const { appEntry, SpaConfigPlugin } = spa;

module.exports = ({ config }) => {
    // Build webpack config
    config.entry["frontend"] = appEntry(__dirname + "/Frontend/index.js");

    config.plugins = [
        ...config.plugins,
        new HtmlWebpackPlugin({
            name: "frontend",
            filename: "frontend.html",
            template: __dirname + "/Frontend/index.html",
            chunks: ["frontend"]
        }),
        new SpaConfigPlugin()
    ];

    return config;
};
