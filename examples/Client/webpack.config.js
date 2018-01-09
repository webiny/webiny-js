const WebinyConfigPlugin = require('./WebinyConfigPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const {entryPoint} = require('webiny-cli/utils');

module.exports = (app) => {
    app.entry['admin'] = entryPoint(__dirname + '/Admin/index.js');

    app.entry['admin'] = [
        'react-hot-loader/patch',
        'webpack-hot-middleware/client?quiet=false&noInfo=true&warn=false&overlay=true&reload=false',
        'webpack/hot/only-dev-server',
        __dirname + '/Admin/index.js'
    ];
    app.entry['frontend'] = [
        'react-hot-loader/patch',
        'webpack-hot-middleware/client?quiet=false&noInfo=true&warn=false&overlay=true&reload=false',
        'webpack/hot/only-dev-server',
        __dirname + '/Frontend/index.js'
    ];

    app.plugins = [
        new webpack.optimize.CommonsChunkPlugin({
            name: "common",
            filename: "common.js",
            chunks: ["admin", "frontend"]
        }),
        ...app.plugins,
        new HtmlWebpackPlugin({
            name: 'admin',
            filename: 'admin.html',
            template: __dirname + '/Admin/index.html',
            chunks: ['common', 'admin']
        }),
        new HtmlWebpackPlugin({
            name: 'frontend',
            filename: 'frontend.html',
            template: __dirname + '/Frontend/index.html',
            chunks: ['common', 'frontend']
        }),
        new WebinyConfigPlugin(require('./Configs.js'))
    ];

    return app;
};