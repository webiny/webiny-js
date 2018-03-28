"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _webpack = require("webpack");

var _webpack2 = _interopRequireDefault(_webpack);

var _extractTextWebpackPlugin = require("extract-text-webpack-plugin");

var _extractTextWebpackPlugin2 = _interopRequireDefault(_extractTextWebpackPlugin);

var _cleanWebpackPlugin = require("clean-webpack-plugin");

var _cleanWebpackPlugin2 = _interopRequireDefault(_cleanWebpackPlugin);

var _optimizeCssAssetsWebpackPlugin = require("optimize-css-assets-webpack-plugin");

var _optimizeCssAssetsWebpackPlugin2 = _interopRequireDefault(_optimizeCssAssetsWebpackPlugin);

var _autodllWebpackPlugin = require("autodll-webpack-plugin");

var _autodllWebpackPlugin2 = _interopRequireDefault(_autodllWebpackPlugin);

var _uglifyjsWebpackPlugin = require("uglifyjs-webpack-plugin");

var _uglifyjsWebpackPlugin2 = _interopRequireDefault(_uglifyjsWebpackPlugin);

var _AssetFileName = require("./plugins/AssetFileName");

var _AssetFileName2 = _interopRequireDefault(_AssetFileName);

var _AssetsMeta = require("./plugins/AssetsMeta");

var _AssetsMeta2 = _interopRequireDefault(_AssetsMeta);

var _ModuleIds = require("./plugins/ModuleIds");

var _ModuleIds2 = _interopRequireDefault(_ModuleIds);

var _ChunkIds = require("./plugins/ChunkIds");

var _ChunkIds2 = _interopRequireDefault(_ChunkIds);

var _styles = require("./styles");

var _styles2 = _interopRequireDefault(_styles);

var _babel = require("./babel");

var _babel2 = _interopRequireDefault(_babel);

var _vendor = require("webiny-app/lib/vendor");

var _vendor2 = _interopRequireDefault(_vendor);

var _webpackConfigUtils = require("webpack-config-utils");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

// List of vendor libraries to create a DLL

// Config helpers

// Custom plugins
const { ifProduction, ifDevelopment } = (0, _webpackConfigUtils.getIfUtils)(process.env.NODE_ENV);

// Webpack plugins

exports.default = ({ projectRoot, appRoot, urlGenerator }) => {
    const definePlugin = new _webpack2.default.DefinePlugin({
        "process.env": {
            NODE_ENV: (0, _stringify2.default)(process.env.NODE_ENV)
        }
    });

    const assetFileNamePlugin = ifProduction(new _AssetFileName2.default());
    const assetsMetaPlugin = new _AssetsMeta2.default({ projectRoot, urlGenerator });
    const uglifyPlugin = ifProduction(new _uglifyjsWebpackPlugin2.default());

    const plugins = (0, _webpackConfigUtils.removeEmpty)([
        definePlugin,
        new _autodllWebpackPlugin2.default({
            inject: true,
            filename: "[name].dll.js",
            plugins: (0, _webpackConfigUtils.removeEmpty)([
                definePlugin,
                uglifyPlugin,
                assetFileNamePlugin
            ]),
            entry: {
                vendor: _vendor2.default
            },
            module: {
                rules: [
                    {
                        test: /\.jsx?$/,
                        exclude: /node_modules/,
                        use: [
                            {
                                loader: "babel-loader",
                                options: _babel2.default
                            }
                        ]
                    }
                ]
            }
        }),
        new _webpack2.default.ProvidePlugin({
            $: "jquery",
            jQuery: "jquery"
        }),
        new _cleanWebpackPlugin2.default(["dist/" + process.env.NODE_ENV], { root: projectRoot }),
        new _ModuleIds2.default(),
        new _ChunkIds2.default({ projectRoot }),
        ifDevelopment(new _webpack2.default.NoEmitOnErrorsPlugin()),
        ifDevelopment(new _webpack2.default.HotModuleReplacementPlugin()),
        new _extractTextWebpackPlugin2.default("styles.css"),
        assetFileNamePlugin,
        assetsMetaPlugin,
        ifDevelopment(new _webpack2.default.NamedModulesPlugin()),
        ifProduction(new _webpack2.default.optimize.ModuleConcatenationPlugin()),
        ifProduction(new _webpack2.default.HashedModuleIdsPlugin()),
        uglifyPlugin,
        ifProduction(
            new _optimizeCssAssetsWebpackPlugin2.default({
                canPrint: false,
                assetNameRegExp: /\.css$/,
                cssProcessorOptions: {
                    discardComments: { removeAll: true },
                    safe: true,
                    reduceInitial: { disable: true }
                }
            })
        ),
        new _webpack2.default.IgnorePlugin(/^\.\/locale$/, /moment$/)
    ]);

    const fileExtensionRegex = /\.(png|jpg|gif|jpeg|mp4|mp3|woff2?|ttf|otf|eot|svg|ico)$/;

    const fileLoaderOptions = name => {
        return {
            name,
            context: _path2.default.resolve(appRoot, "assets"),
            outputPath: file => {
                if (file.startsWith("_/")) {
                    const parts = file.replace(/_\//g, "").split("/assets/");
                    file = _path2.default.normalize(
                        _path2.default.join("external", parts[0], parts[1])
                    );
                }
                return file;
            },
            publicPath: file => {
                if (file.startsWith("_/")) {
                    const parts = file.replace(/_\//g, "").split("/assets/");
                    file = _path2.default.normalize(
                        _path2.default.join("external", parts[0], parts[1])
                    );
                }
                return urlGenerator.generate(file);
            }
        };
    };

    return {
        cache: true,
        context: appRoot,
        devtool: ifDevelopment("eval-source-map", "cheap-module-source-map"),
        entry: {},
        output: {
            path: _path2.default.resolve(
                _path2.default.join(projectRoot, "dist", process.env.NODE_ENV)
            ),
            filename: "[name].js",
            chunkFilename: "chunks/[name].js",
            publicPath: ifDevelopment("/", "")
        },
        plugins,
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    use: (0, _webpackConfigUtils.removeEmpty)([
                        {
                            loader: "babel-loader",
                            options: _babel2.default
                        },
                        ifDevelopment("hot-accept-loader")
                    ])
                },
                {
                    test: /bootstrap-sass/,
                    include: /\.js$/,
                    use: 'imports-loader?jQuery=>require("jquery")'
                },
                (0, _styles2.default)(),
                {
                    test: /node_modules/,
                    include: fileExtensionRegex,
                    loader: "file-loader",
                    options: {
                        context: _path2.default.resolve(projectRoot, "node_modules"),
                        name: ifDevelopment("[path][name].[ext]", "[path][name]-[hash].[ext]"),
                        outputPath: file => {
                            const parts = file.replace(/_\//g, "").split("node_modules/");
                            return _path2.default.normalize(
                                _path2.default.join("external", parts.pop())
                            );
                        },
                        publicPath: file => {
                            const parts = file.replace(/_\//g, "").split("node_modules/");
                            file = _path2.default.normalize(
                                _path2.default.join("external", parts.pop())
                            );
                            return urlGenerator.generate(file);
                        }
                    }
                },
                // Files containing /public/ should not include [hash]
                // This is for rare occasions when we need to include a path to the file in TPL template
                {
                    test: fileExtensionRegex,
                    exclude: /node_modules/,
                    include: /\/public\//,
                    loader: "file-loader",
                    options: fileLoaderOptions("[path][name].[ext]")
                },
                {
                    test: fileExtensionRegex,
                    exclude: (0, _webpackConfigUtils.removeEmpty)([
                        /node_modules/,
                        ifProduction(/\/public\//)
                    ]),
                    loader: "file-loader",
                    options: fileLoaderOptions(
                        ifDevelopment("[path][name].[ext]", "[path][name]-[hash].[ext]")
                    )
                }
            ]
        },
        resolve: {
            alias: {
                jquery: require.resolve("jquery/dist/jquery.slim.js")
            },
            extensions: [".jsx", ".js", ".css", ".scss"]
        },
        resolveLoader: {
            modules: [__dirname + "/loaders", "node_modules"]
        }
    };
};
//# sourceMappingURL=webpack.config.js.map
