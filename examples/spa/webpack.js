/* eslint-disable */
const Visualizer = require("webpack-visualizer-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { spa } = require("webiny-scripts");

const { appEntry, SpaConfigPlugin } = spa;

module.exports = {
    app: ({ config }) => {
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
            new SpaConfigPlugin(),
            new Visualizer({ filename: "app-stats.html" })
        ];

        return config;
    },
    vendor: ({ config }) => {
        config.entry = [
            "jquery",
            "@fortawesome/fontawesome",
            "@fortawesome/fontawesome-free-solid",
            "@fortawesome/react-fontawesome",
            "react",
            "react-dom",
            "react-error-boundary",
            "history",
            "classnames",
            "graphql",
            "graphql-tag",
            "webiny-app"
        ];

        config.resolve = {
            ...config.resolve,
            modules: [__dirname + "/../../node_modules"]
        };

        return config;
    }
};
