const path = require('path');
const vendor = require('webiny-app/lib/vendor');

module.exports = ({ themeRoot }) => {
    return {
        entry: path.join(themeRoot, './index.js'),
        output: {
            path: path.join(themeRoot + '/dist'),
            filename: 'index.js',
            chunkFilename: '[id].js',
            libraryTarget: 'commonjs2',
            publicPath: '/themes/default/'
        },
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    exclude: /node_modules/,
                    use: [
                        {
                            loader: 'babel-loader',
                            options: require('./../spa/babel')
                        }
                    ]
                },
            ]
        },
        externals: [
            function (context, request, callback) {
                let i;
                for (i = 0; i < vendor.length; i++) {
                    const reg = new RegExp(`^${vendor[i]}`);
                    if (reg.test(request)) {
                        callback(null, `external webinyVendor['${request}']`);
                        return;
                    }
                }
                callback();
            }
        ]
    }
};