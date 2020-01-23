const path = require("path");
const WebpackBar = require("webpackbar");
const aliases = require("@webiny/project-utils/aliases");
const packages = require("@webiny/project-utils/packages");

module.exports = {
    entry: path.resolve(__dirname, "./handler.js"),
    mode: "development",
    devtool: false,
    plugins: [new WebpackBar({ name: "Site handler" })],
    output: {
        filename: "handler.js",
        path: path.resolve("build"),
        libraryTarget: "commonjs"
    },
    target: "node",
    node: {
        __dirname: false
    },
    // Run babel on all .js files and skip those in node_modules
    module: {
        exprContextCritical: false,
        rules: [
            {
                test: /\.js$/,
                loader: "babel-loader",
                exclude: /node_modules/,
                include: [...packages],
                options: {
                    babelrc: true,
                    babelrcRoots: packages,
                    presets: [
                        [
                            "@babel/preset-env",
                            {
                                targets: {
                                    node: "10.16"
                                }
                            }
                        ]
                    ],
                    plugins: [
                        "@babel/plugin-proposal-class-properties",
                        ["babel-plugin-module-resolver", { alias: aliases }],
                        ["babel-plugin-lodash", { id: ["lodash"] }]
                    ]
                }
            }
        ]
    },
    resolve: {
        alias: aliases,
        modules: [path.resolve("node_modules"), "node_modules"]
    }
};
