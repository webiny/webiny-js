const path = require("path");

const isEnvDevelopment = process.env.NODE_ENV === "development";

module.exports = {
    entry: path.join(__dirname, "src", "index.js"),
    target: "node",
    output: {
        libraryTarget: "commonjs",
        path: path.join(__dirname, "build"),
        filename: "handler.js"
    },
    devtool: isEnvDevelopment ? "source-map" : undefined,
    externals: ["aws-sdk"],
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
        exprContextCritical: false
    }
};
