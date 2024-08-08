const path = require("path");
const rspack = require("@rspack/core");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const { version } = require("@webiny/project-utils/package.json");
const { getOutput, getEntry } = require("../../utils");

module.exports = options => {
    const output = getOutput(options);
    const entry = getEntry(options);

    const { cwd, overrides, production, watch } = options;

    let swcOptions = require("./swcrc");
    // Customize Babel options.
    if (typeof overrides.swc === "function") {
        swcOptions = overrides.swc(swcOptions);
    }

    const sourceMaps = options.sourceMaps !== false;

    const definitions = overrides.define ? JSON.parse(overrides.define) : {};
    const tsChecksEnabled = process.env.WEBINY_ENABLE_TS_CHECKS === "true";

    return {
        watch,
        entry: [
            sourceMaps && require.resolve("source-map-support/register"),
            path.resolve(entry)
        ].filter(Boolean),
        target: "node",
        output: {
            libraryTarget: "commonjs",
            path: output.path,
            filename: output.filename,
            chunkFilename: `[name].[contenthash:8].chunk.js`
        },
        devtool: sourceMaps ? "source-map" : false,
        externals: [/^@aws-sdk/, /^sharp$/],
        mode: production ? "production" : "development",
        optimization: {
            minimize: production
        },
        performance: {
            // Turn off size warnings for entry points
            hints: false
        },
        plugins: [
            new rspack.DefinePlugin({
                "process.env.WEBINY_VERSION": JSON.stringify(process.env.WEBINY_VERSION || version),
                ...definitions
            }),
            /**
             * This is necessary to enable JSDOM usage in Lambda.
             */
            new rspack.IgnorePlugin({
                resourceRegExp: /canvas/,
                contextRegExp: /jsdom$/
            }),
            tsChecksEnabled &&
                new ForkTsCheckerWebpackPlugin({
                    typescript: {
                        configFile: path.resolve(cwd, "./tsconfig.json"),
                        typescriptPath: require.resolve("typescript")
                    },
                    async: !production
                }),
            // new rspack.ProgressPlugin({})
        ].filter(Boolean),

        module: {
            exprContextCritical: false,
            rules: [
                {
                    oneOf: [
                        sourceMaps && {
                            test: /\.js$/,
                            enforce: "pre",
                            use: [require.resolve("source-map-loader")]
                        },
                        {
                            test: /\.mjs$/,
                            include: /node_modules/,
                            type: "javascript/auto",
                            resolve: {
                                fullySpecified: false
                            }
                        },
                        {
                            test: /\.(js|ts)$/,
                            loader: "builtin:swc-loader",
                            exclude: /node_modules/,
                            options: {
                                jsc: {
                                    baseUrl: cwd,
                                    paths: {
                                        "~/*": ["src/*"],
                                        "~": ["src"]
                                    }
                                }
                            }
                        }
                    ].filter(Boolean)
                },
                /**
                 * Some NPM libraries import CSS automatically, and that breaks the build.
                 * To eliminate the problem, we use the `null-loader` to ignore CSS.
                 */
                {
                    test: /\.css$/,
                    loader: require.resolve("null-loader")
                }
            ]
        },
        resolve: {
            modules: [path.resolve(path.join(cwd, "node_modules")), "node_modules"],
            extensions: [".ts", ".mjs", ".js", ".json", ".css"]
        }
    };
};
