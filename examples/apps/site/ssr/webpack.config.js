const path = require("path");
const webpack = require("webpack");

module.exports = {
    entry: path.resolve("ssr", "ssr.js"),
    output: {
        filename: "ssr.js",
        path: path.resolve("build-ssr"),
        libraryTarget: "commonjs",
        publicPath: process.env.PUBLIC_URL
    },
    resolve: {
        alias: {
            webfontloader: "null-loader",
            "react-spinner-material": "null-loader"
        },
        extensions: [".js", ".json", ".jsx", ".mjs"]
    },
    target: "node",
    node: {
        __dirname: false
    },
    plugins: [
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
                        test: [/\.mjs$/, /\.js$/, /\.jsx$/],
                        exclude: /node_modules/,
                        use: "babel-loader"
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
};
