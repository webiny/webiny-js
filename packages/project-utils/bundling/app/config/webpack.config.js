"use strict";

const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin");
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const InterpolateHtmlPlugin = require("react-dev-utils/InterpolateHtmlPlugin");
const getCSSModuleLocalIdent = require("react-dev-utils/getCSSModuleLocalIdent");
const getClientEnvironment = require("./env");
const ESLintPlugin = require("eslint-webpack-plugin");
const ModuleNotFoundPlugin = require("react-dev-utils/ModuleNotFoundPlugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const WebpackBar = require("webpackbar");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");

const materialNodeModules = require.resolve("@material/base/package.json").split("@material")[0];
const sassIncludePaths = [
    path.resolve("./src"),
    path.resolve("./node_modules"),
    materialNodeModules
];

// Generates a unique static folder name, for example "static-mi7aan0cqpo".
const STATIC_FOLDER = "static";

// Some apps do not need the benefits of saving a web request, so not inlining the chunk
// makes for a smoother build process.
const shouldInlineRuntimeChunk = process.env.INLINE_RUNTIME_CHUNK !== "false";

const imageInlineSizeLimit = parseInt(process.env.IMAGE_INLINE_SIZE_LIMIT || "10000");

// style files regexes
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;

const sassLoader = {
    loader: require.resolve("sass-loader"),
    options: {
        // webpackImporter: false,
        sourceMap: true,
        sassOptions: {
            includePaths: sassIncludePaths,
            quietDeps: true
        }
    }
};

// This is the production and development configuration.
// It is focused on developer experience, fast rebuilds, and a minimal bundle.
module.exports = function (webpackEnv, { paths, options }) {
    const isEnvDevelopment = webpackEnv === "development";
    const isEnvProduction = webpackEnv === "production";

    const modules = require("./modules")({ paths });

    const { logs, overrides } = options;
    let babelCustomizer = overrides.babel;
    if (!babelCustomizer) {
        babelCustomizer = v => v;
    }

    // Check if TypeScript is setup
    const useTypeScript = fs.existsSync(paths.appTsConfig);

    // Variable used for enabling profiling in Production
    // passed into alias object. Uses a flag if passed into the build command
    const isEnvProductionProfile = isEnvProduction && process.argv.includes("--profile");

    // Webpack uses `publicPath` to determine where the app is being served from.
    // It requires a trailing slash, or the file assets will get an incorrect path.
    // In development, we always serve from the root. This makes config easier.
    const publicPath = isEnvProduction ? paths.servedPath : isEnvDevelopment && "/";
    // Some apps do not use client-side routing with pushState.
    // For these, "homepage" can be set to "." to enable relative asset paths.
    const shouldUseRelativeAssetPaths = publicPath === "./";

    // Source maps are resource heavy and can cause out of memory issue for large source files.
    const shouldUseSourceMap = isEnvDevelopment || process.env.GENERATE_SOURCEMAP === "true";

    // `publicUrl` is just like `publicPath`, but we will provide it to our app
    // as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
    // Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
    const publicUrl = isEnvProduction ? publicPath.slice(0, -1) : isEnvDevelopment && "";
    // Get environment variables to inject into our app.
    const env = getClientEnvironment(publicUrl);

    return {
        mode: isEnvProduction ? "production" : isEnvDevelopment && "development",
        // Stop compilation early in production
        bail: isEnvProduction,
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
            // Add /* filename */ comments to generated require()s in the output.
            pathinfo: isEnvDevelopment,
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
            publicPath: publicPath,
            // Point sourcemap entries to original disk location (format as URL on Windows)
            devtoolModuleFilenameTemplate: isEnvProduction
                ? info => path.relative(paths.appSrc, info.absoluteResourcePath).replace(/\\/g, "/")
                : isEnvDevelopment &&
                  (info => path.resolve(info.absoluteResourcePath).replace(/\\/g, "/")),
            // this defaults to 'window', but by setting it to 'this' then
            // module chunks which are built will work in web workers as well.
            globalObject: "this"
        },
        optimization: {
            minimize: isEnvProduction,
            minimizer: [
                // This is only used in production mode
                new TerserPlugin({
                    terserOptions: {
                        parse: {
                            // We want terser to parse ecma 8 code. However, we don't want it
                            // to apply any minification steps that turns valid ecma 5 code
                            // into invalid ecma 5 code. This is why the 'compress' and 'output'
                            // sections only apply transformations that are ecma 5 safe
                            // https://github.com/facebook/create-react-app/pull/4234
                            ecma: 8
                        },
                        compress: {
                            ecma: 5,
                            warnings: false,
                            // Disabled because of an issue with Uglify breaking seemingly valid code:
                            // https://github.com/facebook/create-react-app/issues/2376
                            // Pending further investigation:
                            // https://github.com/mishoo/UglifyJS2/issues/2011
                            comparisons: false,
                            // Disabled because of an issue with Terser breaking valid code:
                            // https://github.com/facebook/create-react-app/issues/5250
                            // Pending further investigation:
                            // https://github.com/terser-js/terser/issues/120
                            inline: 2
                        },
                        mangle: {
                            safari10: true
                        },
                        // Added for profiling in devtools
                        keep_classnames: isEnvProductionProfile,
                        keep_fnames: isEnvProductionProfile,
                        output: {
                            ecma: 5,
                            comments: false,
                            // Turned on because emoji and regex is not minified properly using default
                            // https://github.com/facebook/create-react-app/issues/2488
                            ascii_only: true
                        },
                        sourceMap: shouldUseSourceMap
                    }
                }),
                // This is only used in production mode
                new CssMinimizerPlugin({
                    minimizerOptions: {
                        preset: ["default", { minifyFontValues: { removeQuotes: false } }]
                    }
                })
            ],
            // Automatically split vendor and commons
            // https://twitter.com/wSokra/status/969633336732905474
            // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
            splitChunks: {
                chunks: "all",
                name: false
            },
            // Keep the runtime chunk separated to enable long term caching
            // https://twitter.com/wSokra/status/969679223278505985
            // https://github.com/facebook/create-react-app/issues/5358
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
                // Support React Native Web
                // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
                "react-native": require.resolve("react-native-web"),
                "react/jsx-runtime": require.resolve("react/jsx-runtime.js"),
                react: require.resolve("react"),
                // Allows for better profiling with ReactDevTools
                ...(isEnvProductionProfile && {
                    "react-dom$": require.resolve("react-dom/profiling"),
                    "scheduler/tracing": require.resolve("scheduler/tracing-profiling")
                }),
                ...(modules.webpackAliases || {})
            },
            fallback: {
                path: require.resolve("path-browserify"),
                buffer: require.resolve("buffer/")
            }
        },

        module: {
            strictExportPresence: true,
            rules: [
                {
                    // "oneOf" will traverse all following loaders until one will
                    // match the requirements. When no loader matches it will fall
                    // back to the "file" loader at the end of the loader list.
                    oneOf: [
                        {
                            test: /\.m?js$/,
                            include: /node_modules/,
                            type: "javascript/auto",
                            resolve: {
                                fullySpecified: false
                            }
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
                                                    params: {
                                                        overrides: {
                                                            removeViewBox: false
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                },
                                {
                                    ...getUrlLoader()
                                }
                            ]
                        },
                        // "url" loader works like "file" loader except that it embeds assets
                        // smaller than specified limit in bytes as data URLs to avoid requests.
                        // A missing `test` is equivalent to a match.
                        {
                            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
                            ...getUrlLoader()
                        },
                        // Process application JS with Babel.
                        // The preset includes JSX, Flow, TypeScript, and some ESnext features.
                        {
                            test: /\.(js|mjs|jsx|ts|tsx)$/,
                            include: [paths.appSrc, paths.appIndexJs, ...paths.allWorkspaces],
                            loader: require.resolve("babel-loader"),
                            options: babelCustomizer({
                                sourceType: "unambiguous",
                                presets: [
                                    require.resolve("@babel/preset-env"),
                                    require.resolve("@babel/preset-react"),
                                    require.resolve("@babel/preset-typescript")
                                ],
                                plugins: [
                                    [
                                        "babel-plugin-module-resolver",
                                        {
                                            cwd: paths.appPath,
                                            alias: {
                                                "~": "./src"
                                            }
                                        }
                                    ],
                                    isEnvDevelopment && require.resolve("react-refresh/babel")
                                ].filter(Boolean),
                                // This is a feature of `babel-loader` for webpack (not Babel itself).
                                // It enables caching results in ./node_modules/.cache/babel-loader/
                                // directory for faster rebuilds.
                                cacheDirectory: true,
                                // See #6846 for context on why cacheCompression is disabled
                                cacheCompression: false,
                                compact: isEnvProduction,
                                sourceMaps: shouldUseSourceMap
                            })
                        },

                        // "postcss" loader applies autoprefixer to our CSS.
                        // "css" loader resolves paths in CSS and adds assets as dependencies.
                        // "style" loader turns CSS into JS modules that inject <style> tags.
                        // In production, we use MiniCSSExtractPlugin to extract that CSS
                        // to a file, but in development "style" loader enables hot editing
                        // of CSS.
                        // By default we support CSS Modules with the extension .module.css
                        {
                            test: cssRegex,
                            exclude: cssModuleRegex,
                            use: getStyleLoaders({
                                importLoaders: 1
                            }),
                            // Don't consider CSS imports dead code even if the
                            // containing package claims to have no side effects.
                            // Remove this when webpack adds a warning or an error for this.
                            // See https://github.com/webpack/webpack/issues/6571
                            sideEffects: true
                        },
                        // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
                        // using the extension .module.css
                        {
                            test: cssModuleRegex,
                            use: getStyleLoaders({
                                importLoaders: 1,
                                modules: {
                                    getLocalIdent: getCSSModuleLocalIdent
                                }
                            })
                        },
                        // Opt-in support for SASS (using .scss or .sass extensions).
                        // By default we support SASS Modules with the
                        // extensions .module.scss or .module.sass
                        {
                            test: sassRegex,
                            exclude: sassModuleRegex,
                            use: getStyleLoaders(
                                {
                                    importLoaders: 3
                                },
                                sassLoader
                            ),
                            // Don't consider CSS imports dead code even if the
                            // containing package claims to have no side effects.
                            // Remove this when webpack adds a warning or an error for this.
                            // See https://github.com/webpack/webpack/issues/6571
                            sideEffects: true
                        },
                        // Adds support for CSS Modules, but using SASS
                        // using the extension .module.scss or .module.sass
                        {
                            test: sassModuleRegex,
                            use: getStyleLoaders(
                                {
                                    importLoaders: 3,
                                    modules: {
                                        getLocalIdent: getCSSModuleLocalIdent
                                    }
                                },
                                sassLoader
                            )
                        },
                        // "file" loader makes sure those assets get served by WebpackDevServer.
                        // When you `import` an asset, you get its (virtual) filename.
                        // In production, they would get copied to the `build` folder.
                        // This loader doesn't use a "test" so it will catch all modules
                        // that fall through the other loaders.
                        {
                            loader: require.resolve("file-loader"),
                            // Exclude `js` files to keep "css" loader working as it injects
                            // its runtime that would otherwise be processed through "file" loader.
                            // Also exclude `html` and `json` extensions so they get processed
                            // by webpacks internal loaders.
                            exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/, /^$/],
                            options: {
                                name: `${STATIC_FOLDER}/media/[name].[hash:8].[ext]`
                            }
                        }
                        // ** STOP ** Are you adding a new loader?
                        // Make sure to add the new loader(s) before the "file" loader.
                    ]
                }
            ]
        },
        plugins: [
            new webpack.ProvidePlugin({
                Buffer: ["buffer", "Buffer"]
            }),
            // Generates an `index.html` file with the <script> injected.
            new HtmlWebpackPlugin(
                Object.assign(
                    {},
                    {
                        inject: true,
                        template: paths.appHtml
                    },
                    isEnvProduction
                        ? {
                              minify: {
                                  removeComments: true,
                                  collapseWhitespace: true,
                                  removeRedundantAttributes: true,
                                  useShortDoctype: true,
                                  removeEmptyAttributes: true,
                                  removeStyleLinkTypeAttributes: true,
                                  keepClosingSlash: true,
                                  minifyJS: true,
                                  minifyCSS: true,
                                  minifyURLs: true
                              }
                          }
                        : undefined
                )
            ),
            // Inlines the webpack runtime script. This script is too small to warrant
            // a network request.
            // https://github.com/facebook/create-react-app/issues/5358
            isEnvProduction &&
                shouldInlineRuntimeChunk &&
                new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),
            // Makes some environment variables available in index.html.
            // The public URL is available as %PUBLIC_URL% in index.html, e.g.:
            // <link rel="icon" href="%PUBLIC_URL%/favicon.ico">
            // In production, it will be an empty string unless you specify "homepage"
            // in `package.json`, in which case it will be the pathname of that URL.
            // In development, this will be an empty string.
            new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
            // This gives some necessary context to module not found errors, such as
            // the requesting resource.
            new ModuleNotFoundPlugin(paths.appPath),
            // Makes some environment variables available to the JS code, for example:
            // if (process.env.NODE_ENV === 'production') { ... }. See `./env.js`.
            // It is absolutely essential that NODE_ENV is set to production
            // during a production build.
            // Otherwise React will be compiled in the very slow development mode.
            new webpack.DefinePlugin(env.stringified),
            // This is necessary to emit hot updates
            isEnvDevelopment && new ReactRefreshWebpackPlugin(),
            // Watcher doesn't work well if you mistype casing in a path so we use
            // a plugin that prints an error when you attempt to do this.
            // See https://github.com/facebook/create-react-app/issues/240
            isEnvDevelopment && new CaseSensitivePathsPlugin(),
            isEnvProduction &&
                new MiniCssExtractPlugin({
                    // Options similar to the same options in webpackOptions.output
                    // both options are optional
                    filename: `${STATIC_FOLDER}/css/[name].[contenthash:8].css`,
                    chunkFilename: `${STATIC_FOLDER}/css/[name].[contenthash:8].chunk.css`
                }),
            // Generate an asset manifest file with the following content:
            // - "files" key: Mapping of all asset filenames to their corresponding
            //   output file so that tools can pick it up without having to parse
            //   `index.html`
            // - "entrypoints" key: Array of files which are included in `index.html`,
            //   can be used to reconstruct the HTML if necessary
            new WebpackManifestPlugin({
                fileName: "asset-manifest.json",
                publicPath: publicPath,
                generate: (seed, files, entrypoints) => {
                    const manifestFiles = files.reduce((manifest, file) => {
                        manifest[file.name] = file.path;
                        return manifest;
                    }, seed);
                    const entrypointFiles = entrypoints.main.filter(
                        fileName => !fileName.endsWith(".map")
                    );

                    return {
                        files: manifestFiles,
                        entrypoints: entrypointFiles
                    };
                }
            }),

            new ESLintPlugin({
                extensions: ["js", "mjs", "jsx", "ts", "tsx"],
                formatter: require.resolve("react-dev-utils/eslintFormatter"),
                eslintPath: require.resolve("eslint"),
                context: paths.appSrc,
                // ESLint class options
                cwd: paths.appPath,
                resolvePluginsRelativeTo: __dirname,
                baseConfig: {
                    extends: [require.resolve("eslint-config-react-app/base")]
                }
            }),

            // TypeScript type checking
            useTypeScript &&
                new ForkTsCheckerWebpackPlugin({
                    typescript: {
                        configFile: paths.appTsConfig,
                        typescriptPath: require.resolve("typescript")
                    },
                    async: isEnvDevelopment
                }),

            logs && new WebpackBar({ name: path.basename(paths.appPath) })
        ].filter(Boolean),

        // Turn off performance processing because we utilize
        // our own hints via the FileSizeReporter
        performance: false,

        // make the output less verbose
        stats: "errors-warnings",

        // WebpackDevServer is noisy by default so we emit custom message instead
        // by listening to the compiler events with `compiler.hooks[...].tap` calls above.
        infrastructureLogging: {
            colors: true,
            level: "error"
        }
    };

    // common function to get style loaders
    function getStyleLoaders(cssOptions, preProcessor) {
        const loaders = [
            isEnvDevelopment && require.resolve("style-loader"),
            isEnvProduction && {
                loader: MiniCssExtractPlugin.loader,
                options: shouldUseRelativeAssetPaths ? { publicPath: "../../" } : {}
            },
            {
                loader: require.resolve("css-loader"),
                options: {
                    esModule: false,
                    sourceMap: isEnvProduction && shouldUseSourceMap,
                    url: {
                        filter(url) {
                            // Don't resolve inline assets and assets starting with `/`.
                            // Use of absolute path is most likely intentional, and we don't want want to resolve
                            // to actual file system root. Previous versions of css-loader would just ignore these paths,
                            // but the new one is complaining, so we need to make this an explicit rule.
                            if (url.startsWith("data:") || url.startsWith("/")) {
                                return false;
                            }

                            return true;
                        }
                    },

                    ...cssOptions
                }
            },
            {
                // Options for PostCSS as we reference these options twice
                // Adds vendor prefixing based on your specified browser support in
                // package.json
                loader: require.resolve("postcss-loader"),
                options: {
                    postcssOptions: {
                        // Necessary for external CSS imports to work
                        // https://github.com/facebook/create-react-app/issues/2677
                        ident: "postcss",
                        plugins: () => [
                            require("postcss-flexbugs-fixes"),
                            require("postcss-preset-env")({
                                autoprefixer: {
                                    flexbox: "no-2009"
                                },
                                stage: 3,
                                // Necessary for "@material" to work with dart implementation of sass
                                features: {
                                    "custom-properties": false
                                }
                            }),
                            // Adds PostCSS Normalize as the reset css with default options,
                            // so that it honors browserslist config in package.json
                            // which in turn let's users customize the target behavior as per their needs.
                            require("postcss-normalize")()
                        ],
                        sourceMap: isEnvProduction && shouldUseSourceMap
                    }
                }
            }
        ];

        if (preProcessor) {
            loaders.push(
                {
                    loader: require.resolve("resolve-url-loader"),
                    options: {
                        sourceMap: isEnvProduction && shouldUseSourceMap
                    }
                },
                preProcessor
            );
        }
        return loaders.filter(Boolean);
    }

    function getUrlLoader() {
        return {
            loader: require.resolve("url-loader"),
            options: {
                limit: imageInlineSizeLimit,
                name: `${STATIC_FOLDER}/media/[name].[hash:8].[ext]`
            }
        };
    }
};
