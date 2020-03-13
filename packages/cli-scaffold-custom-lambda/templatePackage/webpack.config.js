const path = require("path");

module.exports = {
    entry: path.join(__dirname, "src", "handler.ts"),
    target: "node",
    output: {
        libraryTarget: "commonjs",
        path: path.join(__dirname, "dist"),
        filename: "handler.js"
    },
    // Generate sourcemaps for proper error messages
    devtool: false,
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
    resolve: {
        extensions: [".mjs", ".js", ".json", ".ts"]
    },
    // Run babel on all .js files and skip those in node_modules
    module: {
        exprContextCritical: false,
        rules: [
            {
                test: /\.(js|ts)$/,
                loader: "babel-loader",
                exclude: /node_modules/,
                options: {
                    presets: [
                        [
                            "@babel/preset-env",
                            {
                                targets: {
                                    node: "10.16"
                                }
                            }
                        ],
                        "@babel/preset-typescript"
                    ]
                }
            }
        ]
    }
};
