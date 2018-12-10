// @flowIgnore
const slsw = require("serverless-webpack");

const path = require("path");
const getPackages = require("get-yarn-workspaces");
const packages = getPackages(path.join(process.cwd(), "../../"));

const aliases = packages.reduce((aliases, dir) => {
    const name = path.basename(dir);
    aliases[`^${name}/(?!src)(.+)$`] = `${name}/src/\\1`;
    return aliases;
}, {});

const config = {
    entry: slsw.lib.entries,
    target: "node",
    // Generate sourcemaps for proper error messages
    devtool: "source-map",
    externals: ["aws-sdk", "vertx", "sharp"],
    mode: slsw.lib.webpack.isLocal ? "development" : "production",
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
        rules: [
            {
                test: /\.mjs$/,
                type: "javascript/auto"
            },
            {
                test: /\.js$/,
                loader: "babel-loader",
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
                        "@babel/plugin-transform-destructuring",
                        "@babel/plugin-proposal-class-properties",
                        "@babel/plugin-proposal-object-rest-spread",
                        "@babel/plugin-transform-runtime",
                        "@babel/plugin-syntax-dynamic-import",
                        "babel-plugin-dynamic-import-node",
                        ["babel-plugin-module-resolver", { alias: aliases }]
                    ]
                }
            }
        ]
    }
};

module.exports = config;
