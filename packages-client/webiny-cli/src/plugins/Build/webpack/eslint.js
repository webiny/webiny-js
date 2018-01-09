const Webiny = require('webiny-cli/lib/webiny');

module.exports = {
    // If this will not be enough we will create eslint-config-webiny package and other apps will extend it.
    // For now let's just work with one core .eslintrc file
    test: /\.(js|jsx)$/,
    exclude: /node_modules/,
    include: Webiny.projectRoot(),
    enforce: 'pre',
    use: [{
        loader: 'eslint-loader',
        options: {
            configFile: Webiny.projectRoot('Apps/Webiny/Js/Core/.eslintrc')
        }
    }]
};