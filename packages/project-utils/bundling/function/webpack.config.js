const path = require("path");
const webpack = require("webpack");
const WebpackBar = require("webpackbar");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

const { version } = require("@webiny/project-utils/package.json");
const { getOutput, getEntry } = require("./utils");

module.exports = options => {
    const output = getOutput(options);
    const entry = getEntry(options);

    const { cwd, debug, overrides, production } = options;

    let babelOptions = require("./babelrc");
    // Customize Babel options.
    if (typeof overrides.babel === "function") {
        babelOptions = overrides.babel(babelOptions);
    }

    const definitions = overrides.define ? JSON.parse(overrides.define) : {};

    console.warn(require.resolve("typescript"));

    return {
        entry: path.resolve(entry),
        target: "node",
        output: {
            libraryTarget: "commonjs",
            path: output.path,
            filename: output.filename
        },
        // Generate sourcemaps for proper error messages
        devtool: debug ? "source-map" : false,
        externals: [/^aws-sdk/],
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
                "process.env.WEBINY_VERSION": JSON.stringify(process.env.WEBINY_VERSION || version),
                "process.env.WEBINY_MULTI_TENANCY": JSON.stringify(
                    process.env.WEBINY_MULTI_TENANCY || false
                ),
                ...definitions
            }),
            new ForkTsCheckerWebpackPlugin({
                typescript: {
                    configFile: path.resolve(cwd, "./tsconfig.json"),
                    typescriptPath: require.resolve("typescript")
                },
                async: !production
                //silent: true
            }),
            options.logs && new WebpackBar({ name: path.basename(cwd) })
        ].filter(Boolean),
        // Run babel on all .js files and skip those in node_modules
        module: {
            exprContextCritical: false,
            rules: [
                {
                    test: /\.mjs$/,
                    include: /node_modules/,
                    type: "javascript/auto"
                },
                {
                    test: /\.(js|ts)$/,
                    loader: require.resolve("babel-loader"),
                    exclude: /node_modules/,
                    options: babelOptions
                }
            ]
        },
        resolve: {
            modules: [path.resolve(path.join(cwd, "node_modules")), "node_modules"],
            extensions: [".mjs", ".ts", ".tsx", ".js", ".jsx", ".json"]
        }
    };
};
