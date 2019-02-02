// @flowIgnore
const slsw = require("serverless-webpack");

const path = require("path");
const getPackages = require("get-yarn-workspaces");
const packages = getPackages(path.join(__dirname, "../../"));

const isEnvDevelopment = process.env.NODE_ENV === "development";
const isEnvProduction = !isEnvDevelopment;

const aliases = packages.reduce((aliases, dir) => {
    const name = path.basename(dir);
    aliases[`^${name}/(?!src)(.+)$`] = `${name}/src/\\1`;
    return aliases;
}, {});

module.exports = {
    entry: isEnvDevelopment ? slsw.lib.entries : "./src/handler.js",
    target: "node",
    output: isEnvProduction && {
        libraryTarget: "commonjs",
        path: path.join(__dirname, "build"),
        filename: "handler.js"
    },
    devtool: isEnvDevelopment ? "source-map" : undefined,
    externals: ["aws-sdk", "vertx", "sharp", "mongodb"],
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
