const path = require("path");
const webpack = require("webpack");

// Webpack plugins
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const Visualizer = require("webpack-visualizer-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const AutoDllPlugin = require("autodll-webpack-plugin");

// Custom plugins
const AssetFileNamePlugin = require("./plugins/AssetFileName");
const AssetsMetaPlugin = require("./plugins/AssetsMeta");
const ModuleIdsPlugin = require("./plugins/ModuleIds");
const ChunkIdsPlugin = require("./plugins/ChunkIds");

// Config helpers
const resolveCreator = require("./resolve");
const stylesCreator = require("./styles");
const babelOptions = require("./babel");
// List of vendor libraries to create a DLL
const vendor = require("webiny-client/lib/vendor");

const { getIfUtils, removeEmpty } = require("webpack-config-utils");
const { ifProduction, ifDevelopment } = getIfUtils(process.env.NODE_ENV);

module.exports = ({ projectRoot, appRoot, urlGenerator }) => {
    const definePlugin = new webpack.DefinePlugin({
        DEVELOPMENT: ifDevelopment(true, false),
        PRODUCTION: ifProduction(true, false),
        "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
    });

    const assetFileNamePlugin = ifProduction(new AssetFileNamePlugin());
    const assetsMetaPlugin = new AssetsMetaPlugin({ projectRoot, urlGenerator });
    const uglifyPlugin = ifProduction(
        new webpack.optimize.UglifyJsPlugin({ mangle: true, sourceMap: false })
    );

    const plugins = removeEmpty([
        definePlugin,
        new AutoDllPlugin({
            inject: true,
            filename: "[name].dll.js",
            entry: {
                vendor
            },
            plugins: removeEmpty([definePlugin, assetFileNamePlugin, uglifyPlugin])
        }),
        new CleanWebpackPlugin(["dist/" + process.env.NODE_ENV], { root: projectRoot }),
        new ModuleIdsPlugin(),
        new ChunkIdsPlugin({ projectRoot }),
        ifDevelopment(new webpack.NoEmitOnErrorsPlugin()),
        ifDevelopment(new webpack.HotModuleReplacementPlugin()),
        new ExtractTextPlugin("styles.css"),
        assetFileNamePlugin,
        assetsMetaPlugin,
        ifDevelopment(new webpack.NamedModulesPlugin()),
        ifProduction(new webpack.optimize.ModuleConcatenationPlugin()),
        ifProduction(new webpack.HashedModuleIdsPlugin()),
        uglifyPlugin,
        ifProduction(
            new OptimizeCssAssetsPlugin({
                canPrint: false,
                assetNameRegExp: /\.css$/,
                cssProcessorOptions: {
                    discardComments: { removeAll: true },
                    safe: true,
                    reduceInitial: { disable: true }
                }
            })
        ),
        new Visualizer({ filename: "stats.html" }),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    ]);

    const fileExtensionRegex = /\.(png|jpg|gif|jpeg|mp4|mp3|woff2?|ttf|otf|eot|svg|ico)$/;

    const fileLoaderOptions = name => {
        return {
            name,
            context: path.resolve(appRoot, "Assets"),
            outputPath: file => {
                if (file.startsWith("_/")) {
                    const parts = file.replace(/_\//g, "").split("/Assets/");
                    file = path.normalize(path.join("external", parts[0], parts[1]));
                }
                return file;
            },
            publicPath: file => {
                return urlGenerator.generate(file);
            }
        };
    };

    return {
        cache: true,
        context: appRoot,
        devtool: ifProduction("cheap-module-source-map"),
        entry: {},
        output: {
            path: path.resolve(path.join(projectRoot, "dist", process.env.NODE_ENV)),
            filename: "[name].js",
            chunkFilename: "chunks/[name].js"
        },
        plugins,
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: "babel-loader",
                            options: babelOptions
                        }
                        //'i18n-loader'
                    ]
                },
                {
                    test: /bootstrap-sass/,
                    include: /\.js$/,
                    use: 'imports-loader?jQuery=>require("jquery")'
                },
                stylesCreator(),
                {
                    test: /node_modules/,
                    include: fileExtensionRegex,
                    loader: "file-loader",
                    options: {
                        context: path.resolve(projectRoot, "node_modules"),
                        name: ifDevelopment("[path][name].[ext]", "[path][name]-[hash].[ext]"),
                        outputPath: file => {
                            const parts = file.replace(/_\//g, "").split("node_modules/");
                            return path.normalize(path.join("external", parts.pop()));
                        },
                        publicPath: file => {
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
                    exclude: removeEmpty([/node_modules/, ifProduction(/\/public\//)]),
                    loader: "file-loader",
                    options: fileLoaderOptions(
                        ifDevelopment("[path][name].[ext]", "[path][name]-[hash].[ext]")
                    )
                }
            ]
        },
        resolve: resolveCreator({
            alias: { bluebird: "bluebird/js/browser/bluebird.core.js" }
        }),
        resolveLoader: {
            modules: [__dirname + "/loaders", "node_modules"]
        }
    };
};
