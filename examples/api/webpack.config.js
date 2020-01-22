const path = require("path");
const aliases = require("@webiny/project-utils/aliases/webpack");

module.exports = ({ root, debug }) => {
    return {
        entry: path.join(root, "handler.js"),
        target: "node",
        output: {
            libraryTarget: "commonjs",
            path: path.join(root, "build"),
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
        // Run babel on all .js files and skip those in node_modules
        module: {
            exprContextCritical: false,
            rules: [
                {
                    test: /\.(ts|js)$/,
                    loader: "babel-loader",
                    exclude: /node_modules/,
                    include: [root],
                    options: {
                        babelrc: true,
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
                        ],
                        plugins: [
                            "@babel/plugin-proposal-class-properties",
                            ["babel-plugin-lodash", { id: ["lodash"] }]
                        ]
                    }
                }
            ]
        },
        resolve: {
            alias: aliases,
            modules: [path.resolve(root, "node_modules"), "node_modules"]
        }
    };
};
