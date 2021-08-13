const path = require("path");
const webpack = require("webpack");
const WebpackBar = require("webpackbar");
const { version } = require("@webiny/project-utils/package.json");

module.exports = ({ entry, output, debug = false, babelOptions, define }) => {
    const definitions = define ? JSON.parse(define) : {};

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
            // We do not want to minimize our code.
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
            }),
            new WebpackBar({ name: path.basename(process.cwd()) })
        ],
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
