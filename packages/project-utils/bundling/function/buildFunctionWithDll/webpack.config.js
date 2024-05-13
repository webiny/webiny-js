const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
const WebpackBar = require("webpackbar");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

const { version } = require("@webiny/project-utils/package.json");
const { getOutput, getEntry } = require("../utils");

const isPre529 = () => {
    const { cli } = require("@webiny/cli");
    return fs.existsSync(cli.resolve("api"));
};

module.exports = options => {
    const output = getOutput(options);
    const entry = getEntry(options);

    const { cwd, overrides, production } = options;

    let babelOptions = require("../babelrc");
    // Customize Babel options.
    if (typeof overrides.babel === "function") {
        babelOptions = overrides.babel(babelOptions);
    }

    const sourceMaps = options.sourceMaps !== false;

    const definitions = overrides.define ? JSON.parse(overrides.define) : {};
    const tsChecksEnabled = process.env.WEBINY_DISABLE_TS_CHECKS !== "true";

    return {
        entry: [
            sourceMaps && require.resolve("source-map-support/register"),
            path.resolve(entry)
        ].filter(Boolean),
        target: "node",
        output: {
            path: output.path,
            libraryTarget: "commonjs2",
            filename: output.filename
        },
        devtool: sourceMaps ? "source-map" : false,
        externals: [/^@aws-sdk/],
        mode: production ? "production" : "development",
        optimization: {
            minimize: production
        },
        performance: {
            // Turn off size warnings for entry points
            hints: false
        },
        plugins: [
            new webpack.DefinePlugin({
                "process.env.WEBINY_IS_PRE_529": JSON.stringify(String(isPre529())),
                "process.env.WEBINY_VERSION": JSON.stringify(process.env.WEBINY_VERSION || version),
                ...definitions
            }),
            new webpack.DllReferencePlugin({
                context: cwd,
                manifest: path.join(output.path, "vendor-manifest.json"),
                sourceType: "commonjs2"
            }),
            tsChecksEnabled &&
                new ForkTsCheckerWebpackPlugin({
                    typescript: {
                        configFile: path.resolve(cwd, "./tsconfig.json"),
                        typescriptPath: require.resolve("typescript")
                    },
                    async: !production
                }),
            options.logs && new WebpackBar({ name: path.basename(cwd) })
        ].filter(Boolean),
        // Run babel on all .js files and skip those in node_modules
        module: {
            exprContextCritical: false,
            rules: [
                sourceMaps && {
                    test: /\.js$/,
                    enforce: "pre",
                    use: [require.resolve("source-map-loader")]
                },
                {
                    test: /\.mjs$/,
                    include: /node_modules/,
                    type: "javascript/auto",
                    resolve: {
                        fullySpecified: false
                    }
                },
                {
                    test: /\.(js|ts)$/,
                    loader: require.resolve("babel-loader"),
                    exclude: /node_modules/,
                    options: babelOptions
                }
            ].filter(Boolean)
        },
        resolve: {
            modules: [path.resolve(path.join(cwd, "node_modules")), "node_modules"],
            extensions: [".ts", ".mjs", ".js", ".json"]
        }
    };
};
