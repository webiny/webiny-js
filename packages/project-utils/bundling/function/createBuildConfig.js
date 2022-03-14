module.exports = options => {
    const path = require("path");
    const webpack = require("webpack");
    const WebpackBar = require("webpackbar");
    const { version } = require("@webiny/project-utils/package.json");

    const { getOutput, getEntry } = require("./utils");
    const output = getOutput(options);
    const entry = getEntry(options);

    const { cwd, overrides } = options;

    let babelOptions = require("./babelrc");

    // Customize Babel options.
    if (typeof overrides.babel === "function") {
        babelOptions = overrides.babel(babelOptions);
    }

    const sourceMaps = options.sourceMaps !== false;

    const definitions = overrides.define ? JSON.parse(overrides.define) : {};

    return {
        entry: [
            sourceMaps && require.resolve("source-map-support/register"),
            path.resolve(entry)
        ].filter(Boolean),
        target: "node",
        output: {
            libraryTarget: "commonjs",
            path: output.path,
            filename: output.filename
        },
        devtool: sourceMaps ? "source-map" : false,
        externals: [/^aws-sdk/],
        mode: "production",
        optimization: {
            minimize: true
        },
        performance: {
            // Turn off size warnings for entry points
            hints: false
        },
        plugins: [
            new webpack.DefinePlugin({
                "process.env.WEBINY_VERSION": JSON.stringify(process.env.WEBINY_VERSION || version),
                "process.env.WEBINY_ENABLE_VERSION_HEADER": JSON.stringify(
                    process.env.WEBINY_ENABLE_VERSION_HEADER || "false"
                ),
                "process.env.WEBINY_MULTI_TENANCY": JSON.stringify(
                    process.env.WEBINY_MULTI_TENANCY || false
                ),
                ...definitions
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
                    type: "javascript/auto"
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
            extensions: [".mjs", ".ts", ".tsx", ".js", ".jsx", ".json"]
        }
    };
};
