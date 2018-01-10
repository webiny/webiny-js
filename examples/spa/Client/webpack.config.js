const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { appEntry, SpaConfigPlugin } = require('webiny-client-scripts/spa');

module.exports = ({ config }) => {
    config.entry['admin'] = appEntry(__dirname + '/Admin/index.js');
    config.entry['frontend'] = appEntry(__dirname + '/Frontend/index.js');

    config.plugins = [
        new webpack.optimize.CommonsChunkPlugin({
            name: "common",
            filename: "common.js",
            chunks: ["admin", "frontend"]
        }),
        ...config.plugins,
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
        new SpaConfigPlugin(require('./Configs.js'))
    ];

    return config;
};