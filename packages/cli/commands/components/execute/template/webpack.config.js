const path = require("path");
const fs = require("fs-extra");
const packages = require("get-yarn-workspaces")().map(pkg => pkg.replace(/\//g, path.sep));
const readJson = require("read-json-sync");

const getAliases = buildDirectory => {
    return packages.reduce((aliases, dir) => {
        try {
            const json = readJson(path.join(dir, "package.json"));
            if (fs.existsSync(path.join(dir, buildDirectory))) {
                aliases[`${json.name}`] = `${json.name}/${buildDirectory}`;
            }
        } catch (err) {
            // No package.json, continue.
        }
        return aliases;
    }, {});
};

module.exports = ({ root, entry, debug, destination, babelOptions }) => ({
    entry: path.resolve(entry),
    target: "node",
    output: {
        libraryTarget: "commonjs",
        path: destination,
        filename: "handler.js"
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
    plugins: [],
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
        alias: getAliases("dist"),
        modules: [path.resolve(root, "node_modules"), "node_modules"],
        extensions: [".mjs", ".ts", ".tsx", ".js", ".jsx", ".json"]
    }
});
