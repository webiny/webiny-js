const path = require("path");
const webpack = require("webpack");
const WebpackBar = require("webpackbar");
const { constantCase } = require("constant-case");

const generatePackageVersionDefinitions = () => {
    const pkgJSON = require(path.resolve("package.json"));

    return Object.keys(pkgJSON.dependencies || []).reduce((acc, item) => {
        if (item.startsWith("@webiny/")) {
            const { version } = require(require.resolve(path.join(item, "package.json"), {
                paths: [process.cwd()]
            }));
            acc[`${constantCase(item)}_VERSION`] = JSON.stringify(version);
        }
        return acc;
    }, {});
};

module.exports = ({ entry, output, debug = false, babelOptions, define }) => {
    const packageVersions = generatePackageVersionDefinitions();
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
        mode: "production",
        optimization: {
            // We do not want to minimize our code.
            minimize: false
        },
        performance: {
            // Turn off size warnings for entry points
            hints: false
        },
        plugins: [
            new webpack.DefinePlugin({ ...definitions, ...packageVersions }),
            new WebpackBar({ name: path.basename(process.cwd()), reporters: ["fancy"] })
        ],
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
    };
};
