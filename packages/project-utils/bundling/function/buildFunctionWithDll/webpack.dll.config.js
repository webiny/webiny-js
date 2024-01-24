const path = require("path");
const webpack = require("webpack");
const WebpackBar = require("webpackbar");
const { getOutput } = require("../utils");

module.exports = async options => {
    const { cwd, production } = options;
    const output = getOutput(options);

    let dllEntries = [];

    try {
        const { getDllEntries } = require(cwd + "/dll.js");
        dllEntries = await getDllEntries();
    } catch {
        // dll.js is not defined, means no entries are necessary.
    }
    return {
        entry: {
            dll: dllEntries
        },
        target: "node",
        output: {
            path: output.path,
            filename: "[name].js",
            libraryTarget: "commonjs2"
        },
        devtool: false,
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
            options.logs && new WebpackBar({ name: path.basename(cwd) + "(DLL)" }),
            new webpack.DllPlugin({
                name: "./[name]",
                type: "commonjs2",
                path: path.join(output.path, "vendor-manifest.json")
            })
        ].filter(Boolean),
        resolve: {
            modules: [path.resolve(path.join(cwd, "node_modules")), "node_modules"],
            extensions: [".ts", ".mjs", ".js", ".json"]
        }
    };
};
