import fs from "fs";
import path from "path";
import {
    CssExtractRspackPlugin,
    DefinePlugin,
    HotModuleReplacementPlugin,
    HtmlRspackPlugin,
    ProgressPlugin
} from "@rspack/core";
import ReactRefreshPlugin from "@rspack/plugin-react-refresh";
import tailwindcss from "tailwindcss";
import CaseSensitivePathsPlugin from "case-sensitive-paths-webpack-plugin";
import getCSSModuleLocalIdent from "react-dev-utils/getCSSModuleLocalIdent.js";
import ESLintPlugin from "eslint-webpack-plugin";
import { TsCheckerRspackPlugin } from "ts-checker-rspack-plugin";
import getClientEnvironment from "./env.js";
import { createSwcConfig } from "../createSwcConfig.js";
import modulesFactory from "./modules.js";
import { createRequire } from "module";
import { getAppName } from "./getAppName.js";

const require = createRequire(import.meta.url);

const imageInlineSizeLimit = parseInt(process.env.IMAGE_INLINE_SIZE_LIMIT || "10000");

const STATIC_FOLDER = "static";

/**
 * @param {string} webpackEnv
 * @param {{ paths: any, options: any }} param1
 */
export async function createRspackConfig(webpackEnv, { paths, options }) {
    const isEnvDevelopment = webpackEnv === "development";
    const isEnvProduction = webpackEnv === "production";
    const isEnvProductionProfile = isEnvProduction && process.argv.includes("--profile");

    const { default: tailwindConfig } = await import(
        /* webpackChunkName: "rspack.config.tailwind" */
        "@webiny/admin-ui/tailwind.config.js"
    );

    const modules = modulesFactory({ paths });
    const swcConfig = createSwcConfig(options.cwd);
    const useTypeScript = fs.existsSync(paths.appTsConfig);

    const publicPath = "/";
    const shouldUseSourceMap = isEnvDevelopment || process.env.GENERATE_SOURCEMAP === "true";
    const env = getClientEnvironment(paths);

    const htmlTemplate = fs.readFileSync(paths.appHtml, "utf8");

    return {
        mode: isEnvProduction ? "production" : isEnvDevelopment && "development",
        devtool: shouldUseSourceMap ? "source-map" : false,
        entry: [paths.appIndexJs].filter(Boolean),
        output: {
            path: isEnvProduction ? paths.appBuild : undefined,
            filename: isEnvProduction
                ? `${STATIC_FOLDER}/js/[name].[contenthash:8].js`
                : `${STATIC_FOLDER}/js/[name].js`,
            chunkFilename: isEnvProduction
                ? `${STATIC_FOLDER}/js/[name].[contenthash:8].chunk.js`
                : `${STATIC_FOLDER}/js/[name].chunk.js`,
            publicPath: publicPath
        },
        optimization: {
            splitChunks: { chunks: "all", name: false },
            runtimeChunk: {
                name: entrypoint => `runtime-${entrypoint.name}`
            }
        },
        resolve: {
            modules: ["node_modules", paths.appNodeModules].concat(
                modules.additionalModulePaths || []
            ),
            extensions: paths.moduleFileExtensions
                .map(ext => `.${ext}`)
                .filter(ext => useTypeScript || !ext.includes("ts")),
            alias: {
                "react/jsx-runtime": require.resolve("react/jsx-runtime"),
                react: require.resolve("react"),
                // Allows for better profiling with ReactDevTools
                ...(isEnvProductionProfile && {
                    "react-dom$": require.resolve("react-dom/profiling"),
                    "scheduler/tracing": require.resolve("scheduler/tracing-profiling")
                }),
                // This is a temporary fix, until we sort out the `react-butterfiles` dependency.
                "react-butterfiles": require.resolve("@webiny/app/react-butterfiles/index.js"),
                ...(modules.webpackAliases || {})
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
                            loader: "@svgr/webpack",
                            options: {
                                exportType: "named",
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
                            ? { loader: "style-loader" }
                            : CssExtractRspackPlugin.loader,
                        {
                            loader: "css-loader",
                            options: {
                                sourceMap: shouldUseSourceMap,
                                modules: {
                                    auto: true,
                                    getLocalIdent: getCSSModuleLocalIdent
                                }
                            }
                        },
                        {
                            loader: "postcss-loader",
                            options: {
                                postcssOptions: {
                                    plugins: [
                                        require("postcss-flexbugs-fixes"),
                                        require("postcss-preset-env")({
                                            autoprefixer: { flexbox: "no-2009" },
                                            stage: 3,
                                            features: { "custom-properties": false }
                                        }),
                                        require("postcss-normalize")(),
                                        tailwindcss(tailwindConfig)
                                    ]
                                },
                                sourceMap: shouldUseSourceMap
                            }
                        },
                        {
                            loader: "sass-loader",
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
            new DefinePlugin(env.stringified),
            new HtmlRspackPlugin({
                inject: true,
                minify: isEnvProduction,
                templateContent: htmlTemplate.replace(/%PUBLIC_URL%/g, "<%= PUBLIC_URL %>"),
                templateParameters: {
                    PUBLIC_URL: env.PUBLIC_URL || ""
                }
            }),
            new TsCheckerRspackPlugin({
                typescript: {
                    configFile: paths.appTsConfig,
                    typescriptPath: "typescript"
                },
                async: isEnvDevelopment
            }),
            new ESLintPlugin({
                extensions: ["js", "jsx", "ts", "tsx"],
                eslintPath: "eslint",
                context: path.resolve("src"),
                formatter: "react-dev-utils/eslintFormatter"
            }),
            new CaseSensitivePathsPlugin(),
            new ProgressPlugin({ prefix: getAppName(paths.appPath) }),
            isEnvDevelopment && new ReactRefreshPlugin(),
            isEnvDevelopment && new HotModuleReplacementPlugin()
        ].filter(Boolean),
        performance: false,
        stats: "errors-warnings",
        infrastructureLogging: {
            colors: true,
            level: "error"
        }
    };
}
