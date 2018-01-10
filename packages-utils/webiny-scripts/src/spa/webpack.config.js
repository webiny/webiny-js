/**
 === NOTES ===
 - in development mode your bundles will be significantly larger in size due to hot-reload code being appended to them
 */
const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const Visualizer = require('webpack-visualizer-plugin');
const AssetsPlugin = require('./plugins/Assets');
const ModuleIdsPlugin = require('./plugins/ModuleIds');
const ChunkIdsPlugin = require('./plugins/ChunkIds');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const AutoDllPlugin = require('autodll-webpack-plugin');
const resolveCreator = require('./resolve');
const stylesCreator = require('./styles');
const vendor = require('webiny-client/lib/vendor');
const babelOptions = require('./babel');

const resolve = resolveCreator();

module.exports = ({projectRoot, appRoot}) => {
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
        new CleanWebpackPlugin(['dist/' + process.env.NODE_ENV], { root: projectRoot }),
        new webpack.NamedModulesPlugin(),
        new ModuleIdsPlugin(),
        new ChunkIdsPlugin({projectRoot}),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new ExtractTextPlugin('styles.css'),
        new AssetsPlugin({projectRoot}),
        new Visualizer({ filename: 'stats.html' }),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    ];

    const fileExtensionRegex = /\.(png|jpg|gif|jpeg|mp4|mp3|woff2?|ttf|otf|eot|svg|ico)$/;

    resolve.alias['bluebird'] = 'bluebird/js/browser/bluebird.core.js';

    return {
        cache: true,
        context: appRoot,
        entry: {},
        output: {
            path: path.resolve(path.join(projectRoot, 'dist', 'development')),
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
                        context: path.resolve(projectRoot, 'node_modules'),
                        name: 'external/[path][name].[ext]'
                    }
                },
                {
                    test: fileExtensionRegex,
                    exclude: /node_modules/,
                    loader: 'file-loader',
                    options: {
                        context: path.resolve(appRoot, 'Assets'),
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
