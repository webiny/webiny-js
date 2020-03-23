const webpack = require("webpack");
const WebpackBar = require("webpackbar");
const aliases = require("../../aliases/webpack");

module.exports = ({ entry, outputPath, outputFilename, babelOptions }) => ({
    entry,
    output: {
        filename: outputFilename,
        path: outputPath,
        libraryTarget: "commonjs",
        publicPath: process.env.PUBLIC_URL
    },
    resolve: {
        alias: {
            webfontloader: "null-loader",
            "react-spinner-material": "null-loader",
            ...aliases
        },
        extensions: [".js", ".json", ".jsx", ".mjs"]
    },
    target: "node",
    mode: "production",
    node: {
        __dirname: false
    },
    plugins: [
        new WebpackBar({ name: "App SSR" }),
        new webpack.DefinePlugin({
            "process.env.REACT_APP_GRAPHQL_API_URL": JSON.stringify(
                process.env.REACT_APP_GRAPHQL_API_URL
            ),
            "process.env.REACT_APP_ENV": JSON.stringify(process.env.REACT_APP_ENV || "browser"),
            "process.env.PUBLIC_URL": JSON.stringify(process.env.PUBLIC_URL)
        })
    ],
    module: {
        rules: [
            {
                oneOf: [
                    {
                        test: [/\.mjs$/, /\.tsx?$/, /\.jsx?$/],
                        exclude: /node_modules/,
                        loader: "babel-loader",
                        options: babelOptions
                    },
                    {
                        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
                        loader: "url-loader",
                        options: { limit: 10000, name: "static/media/[name].[hash:8].[ext]" }
                    },
                    {
                        exclude: [/\.mjs$/, /\.js$/, /\.html$/, /\.json$/],
                        loader: "file-loader",
                        options: {
                            name: "static/media/[name].[hash:8].[ext]",
                            publicPath: process.env.PUBLIC_URL,
                            // Do not emit file since this is a server-side render
                            emitFile: false
                        }
                    }
                ]
            }
        ]
    }
});
