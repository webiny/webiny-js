const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");

module.exports = {
    entry: path.resolve(__dirname, "ssr", "function.js"),
    output: {
        filename: "ssr.js",
        path: path.resolve(__dirname, "build"),
        libraryTarget: "commonjs"
    },
    resolve: {
        extensions: [".js", ".json", ".jsx", ".mjs"],
        modules: ["src", "node_modules", "../../node_modules"]
    },
    target: "node",
    node: {
        __dirname: false
    },
    externals: [nodeExternals()],
    plugins: [
        new webpack.DefinePlugin({
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
                test: /\.html$/,
                exclude: /node_modules/,
                use: "raw-loader"
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
