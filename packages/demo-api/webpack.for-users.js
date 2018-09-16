/**
 * This file contains a webpack configuration that should be generated when webiny-cli project generation comes into play.
 */
const slsw = require("serverless-webpack");

module.exports = {
    entry: slsw.lib.entries,
    target: "node",
    // Generate sourcemaps for proper error messages
    devtool: "source-map",
    externals: ["aws-sdk", "vertx"],
    mode: slsw.lib.webpack.isLocal ? "development" : "production",
    optimization: {
        // We do not want to minimize our code.
        minimize: false
    },
    performance: {
        // Turn off size warnings for entry points
        hints: false
    },
    // Run babel on all .js files and skip those in node_modules
    module: {
        rules: [
            {
                test: /\.js$/,
                loader: "babel-loader",
                include: __dirname,
                exclude: /node_modules/,
                options: {
                    presets: [
                        [
                            "@babel/preset-env",
                            {
                                targets: {
                                    node: "8.10"
                                }
                            }
                        ],
                        "@babel/preset-flow"
                    ],
                    plugins: [
                        "@babel/plugin-transform-destructuring",
                        "@babel/plugin-proposal-class-properties",
                        "@babel/plugin-proposal-object-rest-spread",
                        "@babel/plugin-transform-runtime",
                        "@babel/plugin-syntax-dynamic-import",
                        "babel-plugin-dynamic-import-node"
                    ]
                }
            }
        ]
    }
};
