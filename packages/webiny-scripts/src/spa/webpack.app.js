import path from "path";
import fs from "fs-extra";
import webpack from "webpack";

// Webpack plugins
import ExtractTextPlugin from "extract-text-webpack-plugin";
import OptimizeCssAssetsPlugin from "optimize-css-assets-webpack-plugin";
import UglifyJsPlugin from "uglifyjs-webpack-plugin";

// Custom plugins
import AssetFileNamePlugin from "./plugins/AssetFileName";
import AssetsMetaPlugin from "./plugins/AssetsMeta";
import ModuleIdsPlugin from "./plugins/ModuleIds";
import ChunkIdsPlugin from "./plugins/ChunkIds";

// Config helpers
import stylesCreator from "./styles";
import babelOptions from "./babel";

import { getIfUtils, removeEmpty } from "webpack-config-utils";
const { ifProduction, ifDevelopment } = getIfUtils(process.env.NODE_ENV);

export default ({ projectRoot, appRoot, urlGenerator }) => {
    const definePlugin = new webpack.DefinePlugin({
        "process.env": {
            NODE_ENV: JSON.stringify(process.env.NODE_ENV)
        }
    });

    const plugins = removeEmpty([
        definePlugin,
        ifProduction(new ModuleIdsPlugin()),
        ifProduction(new ChunkIdsPlugin({ projectRoot })),
        ifProduction(new AssetFileNamePlugin()),
        ifDevelopment(new webpack.NoEmitOnErrorsPlugin()),
        ifDevelopment(new webpack.HotModuleReplacementPlugin()),
        new ExtractTextPlugin("styles.css"),
        new AssetsMetaPlugin({ projectRoot, urlGenerator }),
        ifDevelopment(new webpack.NamedModulesPlugin()),
        ifProduction(new webpack.optimize.ModuleConcatenationPlugin()),
        ifProduction(new webpack.HashedModuleIdsPlugin()),
        ifProduction(new UglifyJsPlugin()),
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

    // Check if app has vendor DLL defined
    const dllPath = path.resolve(
        path.join(projectRoot, "dist", process.env.NODE_ENV, "vendor.manifest.json")
    );

    if (fs.existsSync(dllPath)) {
        plugins.push(
            new webpack.DllReferencePlugin({
                context: appRoot,
                manifest: require(dllPath)
            })
        );
    }

    const fileExtensionRegex = /\.(png|jpg|gif|jpeg|mp4|mp3|woff2?|ttf|otf|eot|svg|ico)$/;

    return {
        cache: true,
        context: appRoot,
        devtool: ifProduction("cheap-module-source-map"),
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
                    test: fileExtensionRegex,
                    loader: "file-loader",
                    options: {
                        name: ifDevelopment("[path][name].[ext]", "[path][name]-[hash].[ext]")
                    }
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
