"use strict";

const fs = require("fs");
const path = require("path");
const {
    HotModuleReplacementPlugin,
    ProgressPlugin,
    DefinePlugin,
    ProvidePlugin,
    HtmlRspackPlugin,
    CssExtractRspackPlugin
} = require("@rspack/core");
const ReactRefreshPlugin = require("@rspack/plugin-react-refresh");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const getCSSModuleLocalIdent = require("react-dev-utils/getCSSModuleLocalIdent");
const ESLintPlugin = require("eslint-webpack-plugin");
const { getProjectApplication } = require("@webiny/cli/utils");
const { TsCheckerRspackPlugin } = require("ts-checker-rspack-plugin");
const getClientEnvironment = require("./env");
const { getLexicalAliases } = require("./lexicalAliases");
const { createSwcConfig } = require("../createSwcConfig");

// Generates a unique static folder name, for example "static-mi7aan0cqpo".
const STATIC_FOLDER = "static";

const imageInlineSizeLimit = parseInt(process.env.IMAGE_INLINE_SIZE_LIMIT || "10000");

// This is the production and development configuration.
// It is focused on developer experience, fast rebuilds, and a minimal bundle.
module.exports = function (webpackEnv, { paths, options }) {
    const projectApplication = getProjectApplication({ cwd: options.cwd });

    const isEnvDevelopment = webpackEnv === "development";
    const isEnvProduction = webpackEnv === "production";

    const modules = require("./modules")({ paths });

    let swcConfig = createSwcConfig(options.cwd);

    // Check if TypeScript is setup
    const useTypeScript = fs.existsSync(paths.appTsConfig);

    // Variable used for enabling profiling in Production
    // passed into alias object. Uses a flag if passed into the build command
    const isEnvProductionProfile = isEnvProduction && process.argv.includes("--profile");

    // Webpack uses `publicPath` to determine where the app is being served from.
    // It requires a trailing slash, or the file assets will get an incorrect path.
    // In development, we always serve from the root. This makes config easier.
    const publicPath = isEnvProduction ? paths.servedPath : isEnvDevelopment && "/";

    // Source maps are resource heavy and can cause out of memory issue for large source files.
    const shouldUseSourceMap = isEnvDevelopment || process.env.GENERATE_SOURCEMAP === "true";

    // `publicUrl` is just like `publicPath`, but we will provide it to our app
    // as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
    // Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
    const publicUrl = isEnvProduction ? publicPath.slice(0, -1) : isEnvDevelopment && "";
    // Get environment variables to inject into our app.
    const env = getClientEnvironment({ publicUrl, projectApplication });

    /** @type {import('@rspack/core').Configuration} */
    return {
        mode: isEnvProduction ? "production" : isEnvDevelopment && "development",
        devtool: shouldUseSourceMap ? "source-map" : false,
        // These are the "entry points" to our application.
        // This means they will be the "root" imports that are included in JS bundle.
        entry: [
            // Finally, this is your app's code:
            paths.appIndexJs
            // We include the app code last so that if there is a runtime error during
            // initialization, it doesn't blow up the WebpackDevServer client, and
            // changing JS code would still trigger a refresh.
        ].filter(Boolean),
        output: {
            // The build folder.
            path: isEnvProduction ? paths.appBuild : undefined,
            // There will be one main bundle, and one file per asynchronous chunk.
            // In development, it does not produce real files.
            filename: isEnvProduction
                ? `${STATIC_FOLDER}/js/[name].[contenthash:8].js`
                : isEnvDevelopment && `${STATIC_FOLDER}/js/[name].js`,

            // There are also additional JS chunk files if you use code splitting.
            chunkFilename: isEnvProduction
                ? `${STATIC_FOLDER}/js/[name].[contenthash:8].chunk.js`
                : isEnvDevelopment && `${STATIC_FOLDER}/js/[name].chunk.js`,
            // We inferred the "public path" (such as / or /my-project) from homepage.
            // We use "/" in development.
            publicPath: publicPath
        },
        optimization: {
            splitChunks: {
                chunks: "all",
                name: false
            },
            // Keep the runtime chunk separated to enable long term caching
            runtimeChunk: {
                name: entrypoint => `runtime-${entrypoint.name}`
            }
        },
        resolve: {
            // This allows you to set a fallback for where Webpack should look for modules.
            // We placed these paths second because we want `node_modules` to "win"
            // if there are any conflicts. This matches Node resolution mechanism.
            // https://github.com/facebook/create-react-app/issues/253
            modules: ["node_modules", paths.appNodeModules].concat(
                modules.additionalModulePaths || []
            ),
            // These are the reasonable defaults supported by the Node ecosystem.
            // We also include JSX as a common component filename extension to support
            // some tools, although we do not recommend using it, see:
            // https://github.com/facebook/create-react-app/issues/290
            // `web` extension prefixes have been added for better support
            // for React Native Web.
            extensions: paths.moduleFileExtensions
                .map(ext => `.${ext}`)
                .filter(ext => useTypeScript || !ext.includes("ts")),
            alias: {
                "~": path.resolve(__dirname, "src"),
                os: require.resolve("os-browserify/browser"),
                "react/jsx-runtime": require.resolve("react/jsx-runtime"),
                react: require.resolve("react"),
                // Allows for better profiling with ReactDevTools
                ...(isEnvProductionProfile && {
                    "react-dom$": require.resolve("react-dom/profiling"),
                    "scheduler/tracing": require.resolve("scheduler/tracing-profiling")
                }),
                // This is a temporary fix, until we sort out the `react-butterfiles` dependency.
                "react-butterfiles": require.resolve("@webiny/app/react-butterfiles"),
                ...(modules.webpackAliases || {}),
                ...getLexicalAliases()
            },
            fallback: {
                assert: require.resolve("assert-browserify"),
                buffer: require.resolve("buffer/"),
                crypto: require.resolve("crypto-browserify"),
                path: require.resolve("path-browserify"),
                vm: require.resolve("vm-browserify")
            }
        },
        module: {
            rules: [
                {
                    test: /\.(js|mjs|jsx|ts|tsx)$/,
                    use: [{ loader: "builtin:swc-loader", options: swcConfig }],
                    exclude: /node_modules/,
                    type: "javascript/auto"
                },
                {
                    test: /\.svg$/i,
                    issuer: /\.[jt]sx?$/,
                    use: [
                        {
                            loader: require.resolve("@svgr/webpack"),
                            options: {
                                svgoConfig: {
                                    plugins: [
                                        {
                                            name: "preset-default",
                                            params: { overrides: { removeViewBox: false } }
                                        }
                                    ]
                                }
                            }
                        },
                        // Case 2: All other imports (e.g. from CSS or HTML) → emit as asset
                        {
                            loader: "url-loader",
                            options: {
                                limit: 10000,
                                name: "static/media/[name].[hash:8].[ext]"
                            }
                        }
                    ]
                },
                {
                    test: /\.(bmp|gif|jpe?g|png)$/,
                    type: "asset",
                    parser: {
                        dataUrlCondition: {
                            maxSize: imageInlineSizeLimit
                        }
                    }
                },
                {
                    test: /\.(css|scss|sass)$/,
                    use: [
                        isEnvDevelopment
                            ? {
                                  loader: "style-loader"
                              }
                            : CssExtractRspackPlugin.loader,
                        {
                            loader: require.resolve("css-loader"),
                            options: {
                                sourceMap: shouldUseSourceMap,
                                modules: {
                                    auto: true,
                                    getLocalIdent: getCSSModuleLocalIdent
                                }
                            }
                        },
                        {
                            loader: require.resolve("postcss-loader"),
                            options: {
                                postcssOptions: {
                                    plugins: [
                                        require("postcss-flexbugs-fixes"),
                                        require("postcss-preset-env")({
                                            autoprefixer: { flexbox: "no-2009" },
                                            stage: 3,
                                            features: { "custom-properties": false }
                                        }),
                                        require("postcss-normalize")()
                                    ]
                                },
                                sourceMap: shouldUseSourceMap
                            }
                        },
                        {
                            loader: require.resolve("sass-loader"),
                            options: {
                                sourceMap: true,
                                sassOptions: {
                                    includePaths: [
                                        path.resolve("src"),
                                        path.resolve("node_modules")
                                    ],
                                    quietDeps: true
                                }
                            }
                        }
                    ]
                }
            ]
        },
        plugins: [
            isEnvProduction &&
                new CssExtractRspackPlugin({
                    filename: "static/css/[name].[contenthash:8].css",
                    chunkFilename: "static/css/[name].[contenthash:8].chunk.css"
                }),
            new ProvidePlugin({
                Buffer: ["buffer", "Buffer"],
                process: require.resolve("process/browser.js")
            }),
            new DefinePlugin(env.stringified),
            new HtmlRspackPlugin({
                inject: true,
                minify: isEnvProduction,
                template: paths.appHtml,
                templateParameters: {
                    PUBLIC_URL: env.PUBLIC_URL || ""
                }
            }),
            new TsCheckerRspackPlugin({
                typescript: {
                    configFile: paths.appTsConfig,
                    typescriptPath: require.resolve("typescript")
                },
                async: isEnvDevelopment
            }),
            new ESLintPlugin({
                extensions: ["js", "jsx", "ts", "tsx"],
                eslintPath: require.resolve("eslint"),
                context: path.resolve(__dirname, "src"),
                formatter: require.resolve("react-dev-utils/eslintFormatter")
            }),
            new CaseSensitivePathsPlugin(),
            new ProgressPlugin(),
            isEnvDevelopment && new ReactRefreshPlugin(),
            isEnvDevelopment && new HotModuleReplacementPlugin()
        ].filter(Boolean),

        // Turn off performance processing because we use our own hints via the FileSizeReporter.
        performance: false,

        // make the output less verbose
        stats: "errors-warnings",

        // WebpackDevServer is noisy by default, so we emit a custom message instead
        // by listening to the compiler events with `compiler.hooks[...].tap` calls above.
        infrastructureLogging: {
            colors: true,
            level: "error"
        }
    };
};
