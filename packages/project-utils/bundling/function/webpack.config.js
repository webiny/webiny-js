const path = require("path");
const webpack = require("webpack");

module.exports = ({ entry, output, debug = false, babelOptions, define }) => ({
    entry: path.resolve(entry),
    target: "node",
    output: {
        libraryTarget: "commonjs",
        path: output.path,
        filename: output.filename
    },
    // Generate sourcemaps for proper error messages
    devtool: debug ? "source-map" : false,
    externals: ["aws-sdk"],
    mode: "production",
    optimization: {
        // We no not want to minimize our code.
        minimize: false
    },
    performance: {
        // Turn off size warnings for entry points
        hints: false
    },
    plugins: [define && new webpack.DefinePlugin(JSON.parse(define))].filter(Boolean),
    // Run babel on all .js files and skip those in node_modules
    module: {
        exprContextCritical: false,
        rules: [
            {
                test: /\.(js|ts)$/,
                loader: "babel-loader",
                exclude: /node_modules/,
                options: babelOptions
            }
        ]
    },
    resolve: {
        modules: [path.resolve("node_modules"), "node_modules"],
        extensions: [".mjs", ".ts", ".tsx", ".js", ".jsx", ".json"]
    }
});
