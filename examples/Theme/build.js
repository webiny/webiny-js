const webpack = require('webpack');
const vendor = require('webiny-client/lib/vendor');

const config = {
    entry: './index.js',
    output: {
        path: __dirname + '/dist',
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
                        options: require('webiny-cli/lib/plugins/Build/webpack/babel')
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
};

webpack(config).run(function (err, stats) {
    console.log(stats.toString({colors: true}));
});