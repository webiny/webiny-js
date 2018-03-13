/* eslint-disable */
import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { spa } from "webiny-scripts";

const { appEntry, SpaConfigPlugin } = spa;

export default ({ config, urlGenerator }) => {
    // Define asset rules (optional)
    urlGenerator.setRules([{ test: ".js$", domain: "http://localhost:8060" }]);

    // Load SPA config for specific environment
    const spaConfigs =
        process.env.NODE_ENV === "production"
            ? require("./configs.prod.js")
            : require("./configs.dev.js");

    // Build webpack config
    config.entry["admin"] = appEntry(__dirname + "/Admin/index.js");
    config.entry["frontend"] = appEntry(__dirname + "/Frontend/index.js");

    config.plugins = [
        new webpack.optimize.CommonsChunkPlugin({
            name: "common",
            filename: "common.js",
            chunks: ["admin", "frontend"]
        }),
        ...config.plugins,
        new HtmlWebpackPlugin({
            name: "admin",
            filename: "admin.html",
            template: __dirname + "/Admin/index.html",
            chunks: ["common", "admin"]
        }),
        new HtmlWebpackPlugin({
            name: "frontend",
            filename: "frontend.html",
            template: __dirname + "/Frontend/index.html",
            chunks: ["common", "frontend"]
        }),
        new SpaConfigPlugin(spaConfigs)
    ];

    return config;
};
