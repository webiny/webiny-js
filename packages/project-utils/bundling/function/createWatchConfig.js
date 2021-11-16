const path = require("path");
const { version } = require("@webiny/project-utils/package.json");

module.exports = options => {
    const webpack = require("webpack");
    let babelOptions = require("./babelrc");
    const { getOutput, getEntry } = require("./utils");
    const output = getOutput(options);
    const entry = getEntry(options);

    const { overrides, debug } = options;

    // Customize Babel options.
    if (typeof overrides.babel === "function") {
        babelOptions = overrides.babel(babelOptions);
    }

    const definitions = overrides.define ? JSON.parse(overrides.define) : {};

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
        mode: "development",
        optimization: {
            minimize: false
        },
        performance: {
            // Turn off size warnings for entry points
            hints: false
        },
        plugins: [
            new webpack.DefinePlugin({
                "process.env.WEBINY_VERSION": JSON.stringify(process.env.WEBINY_VERSION || version),
                ...definitions
            })
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
            modules: [path.resolve("node_modules"), "node_modules"],
            extensions: [".mjs", ".ts", ".tsx", ".js", ".jsx", ".json"]
        }
    };
};
