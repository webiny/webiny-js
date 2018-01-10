/**
 === NOTES ===
 - in development mode your bundles will be significantly larger in size due to hot-reload code being appended to them
 */
import path from 'path';
import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import Visualizer from 'webpack-visualizer-plugin';
import AssetsPlugin from './plugins/Assets';
import ModuleIdsPlugin from './plugins/ModuleIds';
import ChunkIdsPlugin from './plugins/ChunkIds';
import SpaConfigPlugin from './plugins/SpaConfigPlugin';
import Webiny from 'webiny-cli/lib/webiny';
import CleanWebpackPlugin from 'clean-webpack-plugin';
import AutoDllPlugin from 'autodll-webpack-plugin';
import resolveCreator from './resolve';
import stylesCreator from './styles';
import vendor from 'webiny-client/lib/vendor';
import babelOptions from './babel';

const resolve = resolveCreator();

export default function () {
    const definePlugin = new webpack.DefinePlugin({
        'DEVELOPMENT': true,
        'PRODUCTION': false,
        'process.env': {
            'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        }
    });

    const plugins = [
        definePlugin,
        new AutoDllPlugin({
            inject: true,
            filename: '[name].dll.js',
            entry: {
                vendor
            },
            plugins: [
                definePlugin
            ]
        }),
        new CleanWebpackPlugin(['dist/' + process.env.NODE_ENV], { root: Webiny.projectRoot() }),
        new webpack.NamedModulesPlugin(),
        new ModuleIdsPlugin(),
        new ChunkIdsPlugin(),
        new SpaConfigPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new ExtractTextPlugin('styles.css'),
        new AssetsPlugin(),
        new Visualizer({ filename: 'stats.html' }),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    ];

    const fileExtensionRegex = /\.(png|jpg|gif|jpeg|mp4|mp3|woff2?|ttf|otf|eot|svg|ico)$/;

    resolve.alias['bluebird'] = 'bluebird/js/browser/bluebird.core.js';

    return {
        cache: true,
        context: Webiny.getAppRoot(),
        entry: {},
        output: {
            path: path.resolve(path.join(Webiny.projectRoot('dist'), 'development')),
            filename: '[name].js',
            chunkFilename: 'chunks/[name].js',
            publicPath: '/'
        },
        plugins,
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: babelOptions
                        },
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
                    loader: 'file-loader',
                    options: {
                        context: path.resolve(Webiny.projectRoot(), 'node_modules'),
                        name: 'external/[path][name].[ext]'
                    }
                },
                {
                    test: fileExtensionRegex,
                    exclude: /node_modules/,
                    loader: 'file-loader',
                    options: {
                        context: path.resolve(Webiny.getAppRoot(), 'Assets'),
                        name: '[path][name].[ext]',
                        outputPath: (file) => {
                            if (file.startsWith('_/')) {
                                const parts = file.replace(/_\//g, '').split('/Assets/');
                                file = path.normalize(path.join('external', parts[0], parts[1]));
                            }
                            return file;
                        }
                    }
                }
            ]
        },
        resolve,
        resolveLoader: {
            modules: [
                __dirname + '/loaders',
                'node_modules'
            ]
        }
    }
};
