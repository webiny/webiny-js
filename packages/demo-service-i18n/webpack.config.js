const path = require("path");
const aliases = require("@webiny/project-utils/aliases");
const packages = require("@webiny/project-utils/packages");
const nodeExternals = require("@webiny/webpack-externals");

const isEnvDevelopment = process.env.NODE_ENV === "development";

module.exports = {
    entry: __dirname + "/src/handler.js",
    target: "node",
    output: {
        libraryTarget: "commonjs",
        path: path.join(__dirname, "build"),
        filename: "handler.js"
    },
    // Generate sourcemaps for proper error messages
    devtool: false,
    externals: isEnvDevelopment ? [nodeExternals()] : ["aws-sdk"],
    mode: isEnvDevelopment ? "development" : "production",
    optimization: {
        // We no not want to minimize our code.
        minimize: false
    },
    performance: {
        // Turn off size warnings for entry points
        hints: false
    },
    // Run babel on all .js files and skip those in node_modules
    module: {
        exprContextCritical: false,
        rules: [
            {
                test: /\.js$/,
                loader: "babel-loader",
                exclude: /node_modules/,
                include: packages,
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
                        "@babel/plugin-proposal-class-properties",
                        "@babel/plugin-proposal-object-rest-spread",
                        "@babel/plugin-transform-runtime",
                        ["babel-plugin-module-resolver", { alias: aliases }]
                    ]
                }
            }
        ]
    }
};
