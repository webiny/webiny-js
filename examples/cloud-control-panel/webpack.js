/* eslint-disable */
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { spa } = require("webiny-scripts");

const { appEntry, SpaConfigPlugin } = spa;

module.exports = {
    app: ({ config }) => {
        // Build webpack config
        config.entry["index"] = appEntry(__dirname + "/src/index.js");

        config.plugins = [
            ...config.plugins,
            new HtmlWebpackPlugin({
                name: "index",
                filename: "index.html",
                template: __dirname + "/src/index.html",
                chunks: ["index"]
            }),
            new SpaConfigPlugin()
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
            "webiny-client"
        ];

        config.resolve = {
            ...config.resolve,
            modules: [__dirname + "/../../node_modules"]
        };

        return config;
    }
};
