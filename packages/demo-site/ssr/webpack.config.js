const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");

module.exports = {
    entry: path.resolve("ssr", "server.js"),
    output: {
        filename: "server.js",
        path: path.resolve("build")
    },
    resolve: {
        alias: {
            webfontloader: "null-loader",
            "react-spinner-material": "null-loader"
        },
        extensions: [".js", ".json", ".jsx", ".mjs"],
        modules: [
            path.resolve("src"),
            path.resolve("node_modules"),
            path.resolve("..", "..", "node_modules")
        ]
    },
    target: "node",
    node: {
        __dirname: false
    },
    externals: [nodeExternals()],
    plugins: [
        new webpack.DefinePlugin({
            "process.env.REACT_APP_FUNCTIONS_HOST": JSON.stringify(process.env.REACT_APP_FUNCTIONS_HOST),
            "process.env.REACT_APP_SSR": JSON.stringify(process.env.REACT_APP_SSR || "false")
        })
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: "babel-loader"
            },
            {
                exclude: [/\.mjs$/, /\.js$/, /\.html$/, /\.json$/],
                loader: "file-loader",
                options: {
                    name: "static/media/[name].[hash:8].[ext]",
                    publicPath: "/",
                    emitFile: false
                }
            }
        ]
    }
};
