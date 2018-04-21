import path from "path";
import webpack from "webpack";

// Webpack plugins
import ExtractTextPlugin from "extract-text-webpack-plugin";
import CleanWebpackPlugin from "clean-webpack-plugin";
import OptimizeCssAssetsPlugin from "optimize-css-assets-webpack-plugin";
import AutoDllPlugin from "autodll-webpack-plugin";
import UglifyJsPlugin from "uglifyjs-webpack-plugin";

// Custom plugins
import AssetFileNamePlugin from "./plugins/AssetFileName";
import AssetsMetaPlugin from "./plugins/AssetsMeta";
import ModuleIdsPlugin from "./plugins/ModuleIds";
import ChunkIdsPlugin from "./plugins/ChunkIds";

// Config helpers
import stylesCreator from "./styles";
import babelOptions from "./babel";
// List of vendor libraries to create a DLL
import vendor from "webiny-app/lib/vendor";

import { getIfUtils, removeEmpty } from "webpack-config-utils";

const { ifProduction, ifDevelopment } = getIfUtils(process.env.NODE_ENV);

export default ({ projectRoot, appRoot, urlGenerator }) => {
    const definePlugin = new webpack.DefinePlugin({
        "process.env": {
            NODE_ENV: JSON.stringify(process.env.NODE_ENV)
        }
    });

    const assetFileNamePlugin = ifProduction(new AssetFileNamePlugin());
    const assetsMetaPlugin = new AssetsMetaPlugin({ projectRoot, urlGenerator });
    const uglifyPlugin = ifProduction(new UglifyJsPlugin());

    const plugins = removeEmpty([
        definePlugin,
        new AutoDllPlugin({
            inject: true,
            filename: "[name].dll.js",
            plugins: removeEmpty([definePlugin, uglifyPlugin, assetFileNamePlugin]),
            entry: {
                vendor
            },
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
                        ]
                    }
                ]
            }
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
        )
    ]);

    const fileExtensionRegex = /\.(png|jpg|gif|jpeg|mp4|mp3|woff2?|ttf|otf|eot|svg|ico)$/;

    const fileLoaderOptions = name => {
        return {
            name,
            context: path.resolve(appRoot, "assets"),
            outputPath: file => {
                if (file.startsWith("_/")) {
                    const parts = file.replace(/_\//g, "").split("/assets/");
                    file = path.normalize(path.join("external", parts[0], parts[1]));
                }
                return file;
            },
            publicPath: file => {
                if (file.startsWith("_/")) {
                    const parts = file.replace(/_\//g, "").split("/assets/");
                    file = path.normalize(path.join("external", parts[0], parts[1]));
                }
                return urlGenerator.generate(file);
            }
        };
    };

    return {
        cache: true,
        context: appRoot,
        devtool: ifDevelopment("inline-eval-cheap-source-map", "cheap-module-source-map"),
        entry: {},
        output: {
            path: path.resolve(path.join(projectRoot, "dist", process.env.NODE_ENV)),
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
                    use: removeEmpty([
                        {
                            loader: "babel-loader",
                            options: babelOptions
                        },
                        ifDevelopment("hot-accept-loader")
                    ])
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
                            const parts = file.replace(/_\//g, "").split("node_modules/");
                            file = path.normalize(path.join("external", parts.pop()));
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
